import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { routeMessage, detectTaskType } from "@/lib/ai-router";
import { buildPriceContext, queryMarketData } from "@/lib/rag";
import {
  extractIntent,
  formatIntentForPrompt,
  parseIntentWithLLM,
  isCityVerified,
} from "@/lib/intent-parser";

// ─── Load properties ─────────────────────────────────────────────────────────
const DATA_PATH = path.join(process.cwd(), "..", "data", "properties.json");
let allProperties: Record<string, unknown>[] = [];
try {
  allProperties = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
} catch {
  allProperties = [];
}

// ─── Response Cache ───────────────────────────────────────────────────────────
const responseCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000;
const CACHEABLE_TASK_TYPES = ["chat"];

function getCacheKey(message: string, taskType: string) {
  return `${taskType}:${message.toLowerCase().trim()}`;
}
function getCached(key: string) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) { responseCache.delete(key); return null; }
  return entry.data;
}
function setCache(key: string, data: unknown) {
  if (responseCache.size >= 200) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }
  responseCache.set(key, { data, timestamp: Date.now() });
}

// ─── System Prompt (anti-hallucination, strict) ───────────────────────────────
const SYSTEM_PROMPT = `You are Grey Advisor, an AI real estate query engine for the Indian property market.

YOUR ONLY JOB is to:
1. Parse what the user wants into structured filters
2. Use those filters to query the database
3. Format the results you get back into clean property cards

STRICT RULES — never break these:
- NEVER state a property price from memory. You do not know current Indian real estate prices.
- NEVER recommend a property that did not come from the database query result.
- NEVER guess, estimate, or approximate a price. If the database returns no results, say "No listings found for these filters" — do not fill the gap with invented properties.
- If the user asks about a city or locality you have no database results for, say exactly: "I don't have verified listings for this area yet. Try Pune, Bangalore, or Gurgaon."
- NEVER invent RERA IDs. If no RERA ID came from the database, omit the field entirely.
- MAX 3 CARDS: Never output more than 3 property cards.
- CARRY CONTEXT: Conversation history is provided. Do NOT ask for info already given.

WHAT YOU DO WHEN A USER SENDS A QUERY:

Step 1 — The extracted filters are injected into your context by the system. Trust them.
Step 2 — The database results are injected below under DATABASE RESULTS.
Step 3 — Take ONLY what the database returned and format it into property cards. Do not add any information the database did not give you.

PROPERTY JSON FORMAT — output inside strict <PROPERTIES> tags — a valid JSON array:
[
  {
    "id": "unique-slug-id",
    "name": "Project Name",
    "area": "Micro-market",
    "city": "City",
    "tier": 2,
    "price": 8500000,
    "priceLabel": "85L",
    "pricePerSqft": 8500,
    "sqft": 1000,
    "priceCalc": "1,000 sqft × ₹8,500/sqft = ₹85L",
    "priceConfidence": "verified",
    "type": "Apartment",
    "bedrooms": 2,
    "verifiedStatus": "RERA Registered",
    "reraId": "P52000XXXXX",
    "reraDisclaimer": "Verify on official state RERA portal before transacting",
    "description": "2-line pitch explaining exactly why this matches the user's need.",
    "photoUrl": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    "lat": 18.982,
    "lng": 72.828,
    "builder": "Builder Name",
    "rentalYield": 4.5,
    "pros": ["Pro 1", "Pro 2", "Pro 3"],
    "cons": ["Con 1", "Con 2"],
    "amenities": ["Pool", "Gym", "EV Charging"],
    "action": {
      "type": "BOOK_VISIT",
      "label": "Book Site Visit",
      "whatsappMessage": "Hi Grey Advisor, I'd like to book a site visit for [PropertyName]. Please share available slots."
    }
  }
]

PHOTO URL RULES (vary the number for each card):
- Luxury apartment: https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80
- Villa/Bungalow: https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80
- Studio/1BHK: https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80
- Plot/Land: https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80
- Mid-segment/Tier 2: https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80
- Tier 3/affordable: https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800&q=80

TONE: Be sharp, confident, and data-driven. Sound like a senior property analyst, not a chatbot.
FINANCIAL CALCULATION RULES (only for financial queries):
- GRY = (Annual Rent / Price) × 100
- NRY = ((Annual Rent - Expenses) / Price) × 100 [Expenses ≈ 15-25% of rent]
- EMI = P × r(1+r)^n / ((1+r)^n - 1), where r = monthly rate
- LTCG (post Jul-2024): flat 12.5% NO indexation (holding > 2 years)
- Show all calculations step-by-step with ₹ and L/Cr notation
- Recommend "consult a CA" for LTCG/tax specific queries`;

// ─── Price guardrail validator ────────────────────────────────────────────────
interface PropertyCard {
  city?: string;
  area?: string;
  pricePerSqft?: number;
  [key: string]: unknown;
}

function validateCardPrices(cards: PropertyCard[]): PropertyCard[] {
  return cards.map((card) => {
    if (!card.city || !card.pricePerSqft) return card;
    const marketData = queryMarketData(`${card.area ?? ""} ${card.city}`);
    if (marketData.length === 0) return card;
    const match = marketData[0];
    const inRange =
      card.pricePerSqft >= match.min_sqft * 0.8 &&
      card.pricePerSqft <= match.max_sqft * 1.2;
    if (!inRange) {
      const correctedPpsf = match.avg_sqft;
      const correctedPrice = correctedPpsf * (Number(card.sqft) || 1000);
      return {
        ...card,
        pricePerSqft: correctedPpsf,
        price: correctedPrice,
        priceLabel: correctedPrice >= 10000000
          ? `${(correctedPrice / 10000000).toFixed(1)} Cr`
          : `${(correctedPrice / 100000).toFixed(0)}L`,
        priceCalc: `${card.sqft ?? 1000} sqft × ₹${correctedPpsf.toLocaleString("en-IN")}/sqft = ₹${(correctedPrice / 100000).toFixed(1)}L (price corrected to verified benchmark)`,
        _priceGuardrailApplied: true,
      };
    }
    return card;
  });
}

// ─── Extract property cards from response ─────────────────────────────────────
function extractCards(text: string): { reply: string; cards: PropertyCard[] } {
  const match = text.match(/<PROPERTIES>([\s\S]*?)<\/PROPERTIES>/);
  if (!match) return { reply: text.trim(), cards: [] };
  try {
    const cards = JSON.parse(match[1].trim()) as PropertyCard[];
    const reply = text.replace(/<PROPERTIES>[\s\S]*?<\/PROPERTIES>/, "").trim();
    return { reply, cards };
  } catch {
    return { reply: text.trim(), cards: [] };
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const taskType = detectTaskType(message);
    const isCacheable = CACHEABLE_TASK_TYPES.includes(taskType) && history.length === 0;

    if (isCacheable) {
      const cacheKey = getCacheKey(message, taskType);
      const cached = getCached(cacheKey);
      if (cached) return NextResponse.json({ ...(cached as object), cached: true });
    }

    // ── Step 1: Extract filters with fast LLM call ────────────────────────────
    const filters = await parseIntentWithLLM(message);
    console.log("[Concierge] Extracted filters:", JSON.stringify(filters));

    // ── Guard: unverified city → immediate honest response ────────────────────
    const cityIsUnverified =
      filters.city !== null && !isCityVerified(filters.city);

    if (cityIsUnverified) {
      return NextResponse.json({
        reply: `I don't have verified listings for this area yet. Try Pune, Bangalore, or Gurgaon.`,
        cards: [],
        source: "guardrail",
        model: "guardrail",
        taskType,
        filters,
      });
    }

    // ── Build conversation history ────────────────────────────────────────────
    const conversationHistory = history.map((m: { role: string; text: string }) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.text,
    }));

    // ── Extract cumulative intent (regex, sync) ───────────────────────────────
    const intent = extractIntent(message, history);
    const intentPrompt = formatIntentForPrompt(intent);

    // ── Step 2: Build RAG context ─────────────────────────────────────────────
    const searchQuery = filters.city
      ? `${message} ${filters.city} ${filters.locality ?? ""}`
      : intent.city
      ? `${message} ${intent.city} ${intent.area ?? ""}`
      : message;
    const priceContext = buildPriceContext(searchQuery);

    // ── Compose system prompt with filters + DB results injected ──────────────
    const filtersBlock = `\n\n─── EXTRACTED FILTERS (from this query) ───\n${JSON.stringify(filters, null, 2)}\n\nDATABASE RESULTS: [No live DB yet — Step 2 will fill this. Do NOT invent listings. If city is unverified, say so.]\n`;
    const systemPromptFull = SYSTEM_PROMPT + intentPrompt + filtersBlock + priceContext;

    // ── Step 3: Main LLM call ─────────────────────────────────────────────────
    const { text: rawResponse, model } = await routeMessage(
      message,
      conversationHistory,
      systemPromptFull
    );

    if (!rawResponse) {
      const query = (filters.city ?? intent.city ?? message).toLowerCase();
      const CITIES = ["mumbai", "pune", "bangalore", "hyderabad", "delhi", "chennai"];
      const matchedCity = CITIES.find((c) => query.includes(c));
      const cityMatch = matchedCity
        ? allProperties.filter((p) => String(p.city).toLowerCase().includes(matchedCity))
        : allProperties;
      const fallbackCards = cityMatch.slice(0, 2);
      return NextResponse.json({
        reply: "Grey AI is temporarily busy. Here are some properties that may match — try again for a full AI analysis.",
        cards: fallbackCards,
        source: "fallback",
        model: "fallback",
      });
    }

    let { reply, cards } = extractCards(rawResponse);

    // ── Validate prices against verified benchmarks ───────────────────────────
    cards = validateCardPrices(cards);

    const result = { reply, cards, source: "ai", model, taskType, filters, intent };

    if (isCacheable) {
      setCache(getCacheKey(message, taskType), result);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Concierge error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
