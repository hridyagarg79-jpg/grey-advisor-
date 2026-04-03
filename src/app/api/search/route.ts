import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SEARCH_SYSTEM_PROMPT = `You are a real estate query parser for India. Extract structured search filters from a natural language query.

Return ONLY a valid JSON object with these optional fields (omit fields not mentioned):
{
  "city": "Mumbai" | "Pune" | "Bangalore" | "Delhi NCR" | "Hyderabad" | "Chennai" | null,
  "bedrooms": 1 | 2 | 3 | 4 | null,
  "budget": <number in lakhs, e.g. 250 for ₹2.5 Cr, 150 for ₹1.5 Cr> | null,
  "type": "flat" | "villa" | "house" | "pg" | "plot" | null,
  "purpose": "buy" | "rent" | null,
  "areaKeyword": "<neighbourhood name if mentioned>" | null,
  "intent": "<one-line description of what the user is looking for>"
}

Rules:
- "crore", "Cr", "cr" = multiply by 100 to get lakhs. "3 Cr" = 300. "1.5cr" = 150.
- "lakh", "L", "lac" = as-is. "80L" = 80. "50 lakh" = 50.
- "₹1 crore" = 100. "2.5 crore" = 250.
- If bedrooms mentioned as "3BHK", "3 BHK", "3-bed", "3 bedroom" → bedrooms: 3.
- For city, match closest known Indian metro:
  * "Bombay" or "Mumbai" → "Mumbai"
  * "Bangaluru" or "Bengaluru" or "Bangalore" → "Bangalore"
  * "Hyd" or "Hyderabad" → "Hyderabad"  
  * "Delhi", "NCR", "Gurugram", "Noida", "Gurgaon" → "Delhi NCR"
  * "Pune" → "Pune"
- If area mentioned like "Baner", "Thane", "Koramangala" → set areaKeyword with the area name, and infer city if possible.
- "near schools" / "good connectivity" → include in intent, not as a filter.
- If budget is a range like "50L to 1Cr", use the UPPER bound.
- "under ₹90L" → budget: 90. "below 1.5 crore" → budget: 150.
- Return ONLY the JSON. No explanation, no markdown fences.`;

// ─── Regex-based local fallback (no AI needed) ──────────────────────────────
function extractFiltersLocally(query: string): Record<string, unknown> {
  const q = query.toLowerCase();
  const filters: Record<string, unknown> = {};

  // City detection
  const cityMap: [RegExp, string][] = [
    [/mumbai|bombay/, "Mumbai"],
    [/pune/, "Pune"],
    [/bangalore|bengaluru|bangaluru/, "Bangalore"],
    [/hyderabad|hyd\b/, "Hyderabad"],
    [/delhi|ncr|gurugram|gurgaon|noida/, "Delhi NCR"],
    [/chennai|madras/, "Chennai"],
  ];
  for (const [pattern, city] of cityMap) {
    if (pattern.test(q)) { filters.city = city; break; }
  }

  // Bedrooms
  const bedroomMatch = q.match(/(\d)\s*(?:bhk|bed|bedroom)/i);
  if (bedroomMatch) filters.bedrooms = parseInt(bedroomMatch[1]);

  // Budget (handles: 90l, 90 lakh, 1.5cr, 2 crore, ₹1 crore, under 50L)
  const budgetMatch = q.match(/(?:under|below|upto|up to|around|≤|\u20b9)?\s*(\d+(?:\.\d+)?)\s*(cr(?:ore)?|l(?:akh|ac)?)\b/i);
  if (budgetMatch) {
    const num = parseFloat(budgetMatch[1]);
    const unit = budgetMatch[2].toLowerCase();
    filters.budget = unit.startsWith("c") ? Math.round(num * 100) : Math.round(num);
  }

  // Property type
  if (/villa|bungalow/.test(q)) filters.type = "villa";
  else if (/pg|co.?living|hostel/.test(q)) filters.type = "pg";
  else if (/plot|land/.test(q)) filters.type = "plot";
  else if (/flat|apartment|bhk/.test(q)) filters.type = "flat";

  // Purpose
  if (/\brent\b|\brental\b|\blease\b/.test(q)) filters.purpose = "rent";
  else if (/\bbuy\b|\bpurchase\b|\bsale\b/.test(q)) filters.purpose = "buy";

  return filters;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Try AI-powered extraction first
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SEARCH_SYSTEM_PROMPT },
          { role: "user", content: query },
        ],
        temperature: 0.1,
        max_tokens: 256,
      });

      const raw = completion.choices?.[0]?.message?.content?.trim() || "{}";
      const clean = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

      let filters: Record<string, unknown> = {};
      try {
        filters = JSON.parse(clean);
      } catch {
        // AI returned non-JSON — fall back to local
        filters = extractFiltersLocally(query);
      }

      // Sanitize: remove null values so they don't interfere with URL params
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== null && v !== undefined && v !== "")
      );

      return NextResponse.json({ filters: cleanFilters, query, source: "ai" });
    } catch {
      // AI unavailable — use regex fallback
      const filters = extractFiltersLocally(query);
      return NextResponse.json({ filters, query, source: "local" });
    }
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ filters: {}, query: "", error: "Search unavailable" });
  }
}
