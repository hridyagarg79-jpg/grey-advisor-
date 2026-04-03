/**
 * Intent Parser — Grey Advisor
 *
 * Extracts structured user intent from the current message + conversation history.
 * Intent is cumulative: later messages override earlier ones for the same field,
 * but don't erase unrelated fields (e.g. saying "3BHK" keeps the city from before).
 */

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

// ─── Regex helpers ────────────────────────────────────────────────────────────
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

// ─── Parse a single message ───────────────────────────────────────────────────
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

  // Budget — min (e.g. "above 50 lakhs", "starting from 1 crore")
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
  // Bigram city (navi mumbai, greater noida, south delhi)
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
  if (/ready.?to.?move|resi?dy|immediate possession/.test(q)) partial.ready_to_move = true;
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

  // Process history in chronological order (oldest first)
  const userMessages = history
    .filter((h) => h.role === "user")
    .slice(-10); // last 10 user turns

  for (const h of userMessages) {
    intent = mergeIntents(intent, parseMessage(h.text));
  }

  // Current message has highest priority
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
