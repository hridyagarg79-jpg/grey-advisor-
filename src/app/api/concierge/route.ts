import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { routeMessage, detectTaskType } from "@/lib/ai-router";
import { buildPriceContext, queryMarketData } from "@/lib/rag";
import { extractIntent, formatIntentForPrompt } from "@/lib/intent-parser";

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

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Grey, an elite AI real estate concierge for the Indian property market — Tier 1, 2, and 3 cities. You have access to VERIFIED, REAL pricing data injected below. Your job is to be precise, data-driven, and actionable.

YOUR PERSONA:
- Act like a high-end wealth manager + luxury real estate broker combined.
- Be decisive. Zero fluff. Crisp bullet points (max 10 words each).
- Always prioritize RERA-registered properties from reputed builders.

RESPONSE FORMAT:
1. Executive Summary: 2-3 line analysis of their specific need + market reality.
2. Market Intelligence: 3-4 hard data bullets (₹/sqft, appreciation, yield, infra).
3. Recommendations: 1-3 property cards inside strict <PROPERTIES> JSON tags.

PROPERTY JSON FORMAT (inside <PROPERTIES> tags) — output a valid JSON array:
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
    "reraDisclaimer": "Illustrative ID only — verify on official state RERA portal",
    "description": "2-line bespoke pitch explaining exactly why this matches the user's stated need.",
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
- Commercial: https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80
- Penthouse: https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80
- Mid-segment/Tier 2: https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80
- Tier 3/affordable: https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800&q=80

MAP LINK FORMAT: /map?lat=LAT&lng=LNG&city=CITY_SLUG
Use real coordinates from the verified market data injected below.

ABSOLUTE RULES:
1. PRICE INTEGRITY: ONLY use ₹/sqft from the VERIFIED/ESTIMATED DATA injected below. NEVER make up prices.
2. SHOW MATH: Always write priceCalc showing sqft × ₹/sqft = total (or ≈ total if estimated).
3. MATCH INTENT: Every card MUST match all confirmed user intent fields (BHK, budget, city).
4. PRICE CONFIDENCE: Set priceConfidence = "verified" for known markets | "estimated" for circle-rate-based | "circle-rate-based" for national fallback.
5. VILLAGE/RURAL COVERAGE: For villages, small gram panchayats, or Tier 4 locations — ALWAYS give an answer using the estimated range provided. Never refuse. Mention land appreciation potential honestly.
6. CARRY CONTEXT: Conversation history is provided. Do NOT ask for info already given.
7. MAX 3 CARDS: Never output more than 3 property cards.
8. DISCLAIMER: If priceConfidence is NOT "verified", add a brief disclaimer in the description: "Price estimated from circle rates — verify with local sub-registrar before transacting."`;


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
      // Clamp to verified average
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

    // ✅ Build conversation history for AI
    const conversationHistory = history.map((m: { role: string; text: string }) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.text,
    }));

    // ✅ Extract cumulative intent from full conversation
    const intent = extractIntent(message, history);
    const intentPrompt = formatIntentForPrompt(intent);

    // ✅ Build RAG context — use intent city if message doesn't name one
    const searchQuery = intent.city
      ? `${message} ${intent.city} ${intent.area ?? ""}`
      : message;
    const priceContext = buildPriceContext(searchQuery);

    // ✅ Compose final system prompt
    const systemPromptFull = SYSTEM_PROMPT + intentPrompt + priceContext;

    const { text: rawResponse, model } = await routeMessage(
      message,
      conversationHistory,
      systemPromptFull
    );

    if (!rawResponse) {
      const query = (intent.city ?? message).toLowerCase();
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

    // ✅ Validate and correct prices against verified benchmarks
    cards = validateCardPrices(cards);

    const result = { reply, cards, source: "ai", model, taskType, intent };

    if (isCacheable) {
      setCache(getCacheKey(message, taskType), result);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Concierge error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
