import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { applyPriceGuardrail } from "@/lib/validation";
import { calculateGRY, calculateNRY, calculateGRM, formatIndianCurrency } from "@/lib/financial-calculations";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const AVM_SYSTEM_PROMPT = `You are an expert Indian real estate valuator with deep knowledge of micro-market trends across Indian Tier 1 and Tier 2 cities.

Given a property's specifications, provide a market valuation. Return ONLY a valid JSON object with this EXACT structure — no markdown, no explanation:
{
  "estimatedLow": <number in lakhs, integer>,
  "estimatedHigh": <number in lakhs, integer>,
  "pricePerSqftLow": <number in ₹/sqft, integer>,
  "pricePerSqftHigh": <number in ₹/sqft, integer>,
  "confidence": <number 0-100, be honest — use 40-60 for Tier 2/3 cities you are less sure about>,
  "bullCase": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "bearCase": ["<risk 1>", "<risk 2>"],
  "marketSentiment": "bullish" | "neutral" | "bearish",
  "rentalYield": "<e.g. 3.2% - 3.8%>",
  "summary": "<2 sentence overall assessment>"
}

STRICT PRICE RULES:
- Mumbai micro-markets: South Mumbai ₹30,000–80,000/sqft, Bandra/Juhu ₹35,000–65,000/sqft, Suburbs ₹7,000–18,000/sqft
- Pune: ₹5,500–20,000/sqft depending on area
- Bangalore: ₹7,000–22,000/sqft
- Hyderabad: ₹5,000–18,000/sqft
- Nagpur: ₹3,500–9,000/sqft
- Nashik: ₹3,000–7,000/sqft
- Indore: ₹4,000–10,000/sqft
- For any city you are uncertain about, set confidence to 40 and use conservative (lower) estimates.
- For older buildings (>15 years), apply 10-20% depreciation to land area rate.
- Return ONLY the JSON. No explanation, no markdown fences.`;

export async function POST(req: NextRequest) {
  try {
    const { city, area, type, bedrooms, sqft, age } = await req.json();

    if (!city || !sqft) {
      return NextResponse.json({ error: "City and sqft are required" }, { status: 400 });
    }

    const sqftNum = Number(sqft);
    if (sqftNum < 100 || sqftNum > 50000) {
      return NextResponse.json({ error: "sqft must be between 100 and 50,000" }, { status: 400 });
    }

    const userMessage = `Provide market valuation for:
- City: ${city}
- Area/Neighbourhood: ${area || "city average"}
- Property Type: ${type || "Flat/Apartment"}
- Bedrooms: ${bedrooms || "not specified"}
- Built-up Area: ${sqft} sqft
- Age of Building: ${age ? `${age} years` : "new / under 5 years"}

Return the JSON valuation object only.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: AVM_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.15,   // Very low — we want consistent, factual outputs
      max_tokens: 512,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || "{}";
    const clean = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

    let parsedJson: unknown = {};
    try {
      parsedJson = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: "AI response could not be parsed" }, { status: 500 });
    }

    // ── Apply price guardrail ──────────────────────────────────────────────────
    const guardrail = applyPriceGuardrail(parsedJson, city, area);

    if (!guardrail.valid || !guardrail.data) {
      return NextResponse.json({
        error: "AI valuation failed quality checks",
        details: guardrail.warnings,
      }, { status: 500 });
    }

    const v = guardrail.data;

    // ── Calculate derived financials ──────────────────────────────────────────
    const estimatedPriceRs = ((v.estimatedLow + v.estimatedHigh) / 2) * 100000;
    const avgPricePerSqft = (v.pricePerSqftLow + v.pricePerSqftHigh) / 2;

    // Estimate monthly rent from GRY (using city avg yields)
    const cityYields: Record<string, number> = {
      mumbai: 0.026, pune: 0.035, bangalore: 0.038,
      hyderabad: 0.042, chennai: 0.036, delhi: 0.028,
      nagpur: 0.048, nashik: 0.052, indore: 0.046,
    };
    const yieldRate = cityYields[city.toLowerCase()] ?? 0.035;
    const estimatedMonthlyRent = Math.round((estimatedPriceRs * yieldRate) / 12);

    const financials = {
      grossRentalYield: calculateGRY(estimatedPriceRs, estimatedMonthlyRent),
      netRentalYield: calculateNRY(estimatedPriceRs, estimatedMonthlyRent, sqftNum, city),
      grossRentMultiplier: calculateGRM(estimatedPriceRs, estimatedMonthlyRent),
      estimatedMonthlyRent: formatIndianCurrency(estimatedMonthlyRent),
      pricePerSqftAvg: Math.round(avgPricePerSqft),
    };

    return NextResponse.json({
      valuation: v,
      financials,
      city,
      area,
      sqft: sqftNum,
      dataQuality: guardrail.clamped ? "adjusted" : "verified",
      warnings: guardrail.warnings,
    });

  } catch (err) {
    console.error("AVM error:", err);
    return NextResponse.json({ error: "Valuation service unavailable" }, { status: 500 });
  }
}
