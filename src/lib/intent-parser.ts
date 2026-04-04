/**
 * Intent Parser — Grey Advisor
 *
 * Two-layer system:
 * 1. Fast regex extraction (sync) — used for formatting intent into prompts
 * 2. LLM-based extraction (async, Groq) — used before the main concierge call
 *
 * Intent is cumulative: later messages override earlier ones for the same field.
 */

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserIntent {
  bedrooms?: number;
  budget_max_lakhs?: number;
  budget_min_lakhs?: number;
  city?: string;
  area?: string;
  purpose?: "buy" | "rent" | "invest";
  property_type?: "apartment" | "villa" | "plot" | "commercial" | "studio";
  ready_to_move?: boolean;
  furnished?: "furnished" | "semi-furnished" | "unfurnished";
  facing?: string;
  floor_pref?: "low" | "mid" | "high";
}

// Structured filters extracted by the LLM (Step 1 pre-call)
export interface ParsedFilters {
  city: string | null;
  locality: string | null;
  bhk: number | null;
  budget_min: number | null;   // in rupees
  budget_max: number | null;   // in rupees
  property_type: "apartment" | "villa" | "plot" | null;
  purpose: "buy" | "rent" | null;
  keywords: string[];
}

// ─── Verified cities (where we have reliable DB/RAG data) ────────────────────
export const VERIFIED_CITIES = [
  "mumbai", "pune", "bangalore", "bengaluru", "hyderabad",
  "delhi", "noida", "gurugram", "gurgaon", "chennai",
  "kolkata", "ahmedabad", "navi mumbai", "thane",
];

export function isCityVerified(city: string | null): boolean {
  if (!city) return false;
  return VERIFIED_CITIES.some((vc) => city.toLowerCase().includes(vc));
}

// ─── LLM-based intent extractor (async, Groq llama-3.1-8b-instant) ───────────
const FILTER_EXTRACTION_PROMPT = `Extract real estate search filters from the user message.
Return ONLY a valid JSON object, no explanation, no markdown fences.

Return format:
{
  "city": null or string,
  "locality": null or string,
  "bhk": null or number,
  "budget_min": null or number (in rupees),
  "budget_max": null or number (in rupees),
  "property_type": null or "apartment" or "villa" or "plot",
  "purpose": null or "buy" or "rent",
  "keywords": []
}

Budget parsing rules:
- "80 lakh" = 8000000
- "1 crore" = 10000000
- "50L" = 5000000
- "under 1cr" means budget_max = 10000000, budget_min = null
- "2 to 3 crore" means budget_min = 20000000, budget_max = 30000000
- "50 lakh to 1 crore" means budget_min = 5000000, budget_max = 10000000

Keywords: capture qualitative preferences like "gated community", "metro nearby", "school zone", "investment", "ready to move".`;

export async function parseIntentWithLLM(
  userMessage: string
): Promise<ParsedFilters> {
  const fallback: ParsedFilters = {
    city: null, locality: null, bhk: null,
    budget_min: null, budget_max: null,
    property_type: null, purpose: null, keywords: [],
  };

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // Fast, cheap — intent extraction only
      max_tokens: 300,
      temperature: 0.0, // Deterministic JSON
      messages: [
        { role: "system", content: FILTER_EXTRACTION_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() ?? "{}";
    const clean = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(clean) as ParsedFilters;

    // Ensure keywords is always an array
    if (!Array.isArray(parsed.keywords)) parsed.keywords = [];

    console.log("[Intent Parser] LLM filters:", JSON.stringify(parsed));
    return { ...fallback, ...parsed };
  } catch (err) {
    console.warn("[Intent Parser] LLM extraction failed, using fallback:", err);
    return fallback;
  }
}

// ─── Regex helpers (sync — used for formatting) ───────────────────────────────
const CITY_LIST = [
  "mumbai", "pune", "bangalore", "bengaluru", "hyderabad", "delhi", "noida",
  "gurugram", "gurgaon", "chennai", "kolkata", "ahmedabad", "surat", "jaipur",
  "lucknow", "indore", "nagpur", "nashik", "chandigarh", "coimbatore", "kochi",
  "vizag", "visakhapatnam", "vadodara", "baroda", "bhopal", "mysore", "aurangabad",
  "warangal", "tirupati", "kolhapur", "thane", "navi mumbai",
];

const CITY_NORMALIZE: Record<string, string> = {
  bengaluru: "Bangalore",
  gurgaon: "Delhi",
  gurugram: "Delhi",
  noida: "Delhi",
  visakhapatnam: "Vizag",
  bombay: "Mumbai",
  baroda: "Vadodara",
};

function normalizeCity(raw: string): string {
  const lower = raw.toLowerCase();
  return CITY_NORMALIZE[lower] ?? (raw.charAt(0).toUpperCase() + raw.slice(1));
}

// ─── Parse a single message (sync regex) ─────────────────────────────────────
function parseMessage(text: string): Partial<UserIntent> {
  const q = text.toLowerCase();
  const partial: Partial<UserIntent> = {};

  // BHK / bedrooms
  const bhkMatch = q.match(/(\d)\s*bhk/);
  if (bhkMatch) partial.bedrooms = parseInt(bhkMatch[1]);
  if (/\bstudio\b/.test(q)) partial.bedrooms = 1;
  if (/\b1\s*bedroom\b/.test(q)) partial.bedrooms = 1;
  if (/\b2\s*bedroom\b/.test(q)) partial.bedrooms = 2;
  if (/\b3\s*bedroom\b/.test(q)) partial.bedrooms = 3;
  if (/\b4\s*bedroom\b/.test(q)) partial.bedrooms = 4;

  // Budget — max
  const crMatch = q.match(/(?:under|below|max|within|upto|up to|budget[:\s]+)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore)/);
  if (crMatch) partial.budget_max_lakhs = parseFloat(crMatch[1]) * 100;

  const lakhMatch = q.match(/(?:under|below|max|within|upto|up to|budget[:\s]+)?\s*(\d+(?:\.\d+)?)\s*(?:l\b|lakh|lakhs)/);
  if (lakhMatch) partial.budget_max_lakhs = parseFloat(lakhMatch[1]);

  // Budget — min
  const minCrMatch = q.match(/(?:above|minimum|min|starting|from)\s*(\d+(?:\.\d+)?)\s*(?:cr|crore)/);
  if (minCrMatch) partial.budget_min_lakhs = parseFloat(minCrMatch[1]) * 100;
  const minLakhMatch = q.match(/(?:above|minimum|min|starting|from)\s*(\d+(?:\.\d+)?)\s*(?:l\b|lakh|lakhs)/);
  if (minLakhMatch) partial.budget_min_lakhs = parseFloat(minLakhMatch[1]);

  // City detection
  for (const c of CITY_LIST) {
    if (q.includes(c)) {
      partial.city = normalizeCity(c);
      break;
    }
  }
  if (q.includes("navi mumbai")) partial.city = "Mumbai";
  if (q.includes("greater noida")) partial.city = "Delhi";
  if (q.includes("south delhi")) { partial.city = "Delhi"; partial.area = "South Delhi"; }

  // Purpose
  if (/\brent\b|\brenting\b|\bfor rent\b|\bto rent\b/.test(q)) partial.purpose = "rent";
  if (/\binvest|\binvestment\b|\bpassive income\b|\brental income\b/.test(q)) partial.purpose = "invest";
  if (/\bbuy\b|\bpurchase\b|\bown\b|\bbuying\b/.test(q)) partial.purpose = "buy";

  // Property type
  if (/\bvilla\b|\bbungalow\b/.test(q)) partial.property_type = "villa";
  if (/\bplot\b|\bland\b/.test(q)) partial.property_type = "plot";
  if (/\bcommercial\b|\boffice\b|\bshop\b/.test(q)) partial.property_type = "commercial";
  if (/\bstudio\b/.test(q)) partial.property_type = "studio";
  if (/\bapartment\b|\bflat\b|\bfloor\b/.test(q)) partial.property_type = "apartment";

  // Ready to move
  if (/ready.?to.?move|residy|immediate possession/.test(q)) partial.ready_to_move = true;
  if (/under.?construction|uc\b|new launch/.test(q)) partial.ready_to_move = false;

  // Furnished
  if (/\bfully furnished\b|\bfurnished\b/.test(q)) partial.furnished = "furnished";
  if (/\bsemi.?furnished\b/.test(q)) partial.furnished = "semi-furnished";
  if (/\bunfurnished\b/.test(q)) partial.furnished = "unfurnished";

  return partial;
}

// ─── Merge intents (later message overrides same field) ───────────────────────
function mergeIntents(base: UserIntent, override: Partial<UserIntent>): UserIntent {
  return { ...base, ...override };
}

// ─── Main export: extract cumulative intent from message + history ─────────────
export function extractIntent(
  message: string,
  history: { role: string; text: string }[] = []
): UserIntent {
  let intent: UserIntent = {};

  const userMessages = history
    .filter((h) => h.role === "user")
    .slice(-10); // last 10 user turns

  for (const h of userMessages) {
    intent = mergeIntents(intent, parseMessage(h.text));
  }

  intent = mergeIntents(intent, parseMessage(message));
  return intent;
}

// ─── Format intent for AI prompt injection ────────────────────────────────────
export function formatIntentForPrompt(intent: UserIntent): string {
  if (Object.keys(intent).length === 0) return "";

  const parts: string[] = [];
  if (intent.bedrooms) parts.push(`${intent.bedrooms} BHK`);
  if (intent.property_type) parts.push(intent.property_type);
  if (intent.city) parts.push(`in ${intent.city}`);
  if (intent.area) parts.push(`(${intent.area} area)`);
  if (intent.purpose) parts.push(`for ${intent.purpose}`);
  if (intent.budget_min_lakhs && intent.budget_max_lakhs) {
    parts.push(`budget ₹${intent.budget_min_lakhs}L–${intent.budget_max_lakhs}L`);
  } else if (intent.budget_max_lakhs) {
    parts.push(`budget under ₹${intent.budget_max_lakhs}L`);
  } else if (intent.budget_min_lakhs) {
    parts.push(`budget above ₹${intent.budget_min_lakhs}L`);
  }
  if (intent.ready_to_move === true) parts.push("ready-to-move");
  if (intent.ready_to_move === false) parts.push("under-construction ok");
  if (intent.furnished) parts.push(intent.furnished);

  return (
    `\n\n🎯 CONFIRMED USER INTENT (from full conversation — MUST MATCH ALL THESE EXACTLY):\n` +
    `→ ${parts.join(" | ")}\n` +
    `Full intent JSON: ${JSON.stringify(intent, null, 2)}\n` +
    `RULE: Every property card you generate MUST satisfy ALL confirmed intent fields above. Do NOT deviate.`
  );
}
