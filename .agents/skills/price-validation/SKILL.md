---
name: price-validation-guardrail
description: Zod schema validation and ±15% price guardrail system. Use whenever an LLM outputs a price, valuation, or ₹/sqft figure. Prevents hallucinated numbers from reaching the user.
---

# Price Validation Guardrail — Grey Advisor

## The Problem Being Solved
LLMs (even Llama 3.3 70B) hallucinate ₹/sqft values for Indian cities. A model might output ₹45,000/sqft for Nagpur (actual: ₹4,000–8,000). This guardrail catches and flags such outputs before they reach the user.

## Zod Schemas for LLM Output Validation

```typescript
// lib/validation.ts
import { z } from "zod";

// City price benchmarks: [min ₹/sqft, max ₹/sqft] — update quarterly
export const CITY_BENCHMARKS: Record<string, { min: number; max: number; label: string }> = {
  // Tier 1 — Premium zones
  "mumbai-south": { min: 30000, max: 80000, label: "South Mumbai" },
  "mumbai-bandra": { min: 35000, max: 65000, label: "Bandra/Juhu" },
  "mumbai-suburbs": { min: 7000, max: 18000, label: "Mumbai Suburbs" },
  "mumbai-navi": { min: 5500, max: 12000, label: "Navi Mumbai" },
  "mumbai-thane": { min: 7000, max: 15000, label: "Thane" },
  "pune": { min: 5500, max: 20000, label: "Pune" },
  "bangalore": { min: 7000, max: 22000, label: "Bangalore" },
  "hyderabad": { min: 5000, max: 18000, label: "Hyderabad" },
  "chennai": { min: 6000, max: 16000, label: "Chennai" },
  "delhi": { min: 8000, max: 30000, label: "Delhi" },
  "gurgaon": { min: 9000, max: 25000, label: "Gurgaon/NCR" },
  "noida": { min: 6000, max: 15000, label: "Noida" },
  // Tier 2
  "nagpur": { min: 3500, max: 9000, label: "Nagpur" },
  "nashik": { min: 3000, max: 7000, label: "Nashik" },
  "indore": { min: 4000, max: 10000, label: "Indore" },
  "bhopal": { min: 3500, max: 8000, label: "Bhopal" },
  "surat": { min: 4000, max: 10000, label: "Surat" },
  "vadodara": { min: 3500, max: 8500, label: "Vadodara" },
  "lucknow": { min: 4000, max: 9000, label: "Lucknow" },
  "jaipur": { min: 4500, max: 11000, label: "Jaipur" },
  "coimbatore": { min: 4000, max: 9000, label: "Coimbatore" },
  "kochi": { min: 5000, max: 14000, label: "Kochi" },
  // Tier 3
  "aurangabad": { min: 2500, max: 6000, label: "Aurangabad" },
  "solapur": { min: 2500, max: 5500, label: "Solapur" },
  "amravati": { min: 2000, max: 5000, label: "Amravati" },
};

// Normalize city name to benchmark key
export function getCityKey(city: string, area?: string): string {
  const c = city.toLowerCase().replace(/\s+/g, "-");
  const a = (area ?? "").toLowerCase();

  if (c.includes("mumbai") || c.includes("bombay")) {
    if (a.includes("bandra") || a.includes("juhu") || a.includes("worli") || a.includes("prabhadevi")) return "mumbai-bandra";
    if (a.includes("fort") || a.includes("colaba") || a.includes("nariman") || a.includes("cuffe")) return "mumbai-south";
    if (a.includes("thane")) return "mumbai-thane";
    if (a.includes("navi") || a.includes("kharghar") || a.includes("panvel")) return "mumbai-navi";
    return "mumbai-suburbs";
  }
  return c.split(" ")[0]; // use first word as key
}

// AVM response schema
export const AVMResponseSchema = z.object({
  estimatedLow: z.number().positive(),
  estimatedHigh: z.number().positive(),
  pricePerSqftLow: z.number().positive(),
  pricePerSqftHigh: z.number().positive(),
  confidence: z.number().min(0).max(100),
  bullCase: z.array(z.string()).min(2).max(5),
  bearCase: z.array(z.string()).min(1).max(4),
  marketSentiment: z.enum(["bullish", "neutral", "bearish"]),
  rentalYield: z.string(),
  summary: z.string(),
});

// Validate and apply guardrail
export type AVMResponse = z.infer<typeof AVMResponseSchema>;

export interface GuardrailResult {
  valid: boolean;
  data: AVMResponse | null;
  warnings: string[];
  clamped: boolean;
}

export function applyPriceGuardrail(
  rawData: unknown,
  city: string,
  area?: string
): GuardrailResult {
  const warnings: string[] = [];
  let clamped = false;

  // Parse with Zod
  const parsed = AVMResponseSchema.safeParse(rawData);
  if (!parsed.success) {
    return { valid: false, data: null, warnings: ["Invalid AI response schema"], clamped: false };
  }

  const data = { ...parsed.data };
  const cityKey = getCityKey(city, area);
  const benchmark = CITY_BENCHMARKS[cityKey];

  if (!benchmark) {
    warnings.push(`No benchmark data for ${city} — price not validated`);
    return { valid: true, data, warnings, clamped };
  }

  const BUFFER = 0.20; // 20% allowance beyond benchmark (15% from spec + 5% safety)
  const minAllowed = benchmark.min * (1 - BUFFER);
  const maxAllowed = benchmark.max * (1 + BUFFER);

  // Check and clamp pricePerSqftLow
  if (data.pricePerSqftLow < minAllowed) {
    warnings.push(`Price too low: ₹${data.pricePerSqftLow}/sqft < expected ₹${benchmark.min}/sqft for ${benchmark.label}. Clamped.`);
    data.pricePerSqftLow = Math.round(benchmark.min * 0.9);
    clamped = true;
  }
  if (data.pricePerSqftHigh > maxAllowed) {
    warnings.push(`Price too high: ₹${data.pricePerSqftHigh}/sqft > expected ₹${benchmark.max}/sqft for ${benchmark.label}. Clamped.`);
    data.pricePerSqftHigh = Math.round(benchmark.max * 1.1);
    clamped = true;
  }

  // Lower confidence if clamped
  if (clamped) {
    data.confidence = Math.min(data.confidence, 55);
    warnings.push("Confidence reduced due to price correction.");
  }

  return { valid: true, data, warnings, clamped };
}
```

## Usage in AVM Route
```typescript
import { applyPriceGuardrail } from "@/lib/validation";

// After getting LLM response:
const guardrailResult = applyPriceGuardrail(parsedJson, city, area);

if (!guardrailResult.valid) {
  return NextResponse.json({ error: "AI output failed validation" }, { status: 500 });
}

return NextResponse.json({
  valuation: guardrailResult.data,
  city, area, sqft,
  warnings: guardrailResult.warnings,    // show these in UI if clamped
  dataQuality: guardrailResult.clamped ? "adjusted" : "verified",
});
```

## Rules
- ALWAYS run guardrail before returning any price to the user
- Log all `clamped: true` cases for model improvement
- Tier 2/3 cities get extra skepticism — set confidence cap at 60% when guardrailed
- Display `warnings` in the UI as a subtle disclaimer, not as an error
- Update CITY_BENCHMARKS quarterly using PropEquity/Liases Foras data
