// lib/validation.ts
// Price guardrail — prevents hallucinated ₹/sqft from reaching users

import { z } from "zod";

// City benchmarks [min ₹/sqft, max ₹/sqft] — verified Q1 2026
export const CITY_BENCHMARKS: Record<string, { min: number; max: number; label: string }> = {
  "mumbai-south":   { min: 30000, max: 80000,  label: "South Mumbai" },
  "mumbai-bandra":  { min: 35000, max: 65000,  label: "Bandra/Juhu/Worli" },
  "mumbai-suburbs": { min: 7000,  max: 18000,  label: "Mumbai Suburbs" },
  "mumbai-navi":    { min: 5500,  max: 12000,  label: "Navi Mumbai" },
  "mumbai-thane":   { min: 7000,  max: 15000,  label: "Thane" },
  "pune":           { min: 5500,  max: 20000,  label: "Pune" },
  "bangalore":      { min: 7000,  max: 22000,  label: "Bangalore" },
  "hyderabad":      { min: 5000,  max: 18000,  label: "Hyderabad" },
  "chennai":        { min: 6000,  max: 16000,  label: "Chennai" },
  "delhi":          { min: 8000,  max: 30000,  label: "Delhi" },
  "gurgaon":        { min: 9000,  max: 25000,  label: "Gurgaon/NCR" },
  "noida":          { min: 6000,  max: 15000,  label: "Noida" },
  "nagpur":         { min: 3500,  max: 9000,   label: "Nagpur" },
  "nashik":         { min: 3000,  max: 7000,   label: "Nashik" },
  "indore":         { min: 4000,  max: 10000,  label: "Indore" },
  "bhopal":         { min: 3500,  max: 8000,   label: "Bhopal" },
  "surat":          { min: 4000,  max: 10000,  label: "Surat" },
  "vadodara":       { min: 3500,  max: 8500,   label: "Vadodara" },
  "lucknow":        { min: 4000,  max: 9000,   label: "Lucknow" },
  "jaipur":         { min: 4500,  max: 11000,  label: "Jaipur" },
  "coimbatore":     { min: 4000,  max: 9000,   label: "Coimbatore" },
  "kochi":          { min: 5000,  max: 14000,  label: "Kochi" },
  "aurangabad":     { min: 2500,  max: 6000,   label: "Aurangabad" },
  "solapur":        { min: 2500,  max: 5500,   label: "Solapur" },
};

export function getCityKey(city: string, area?: string): string {
  const c = city.toLowerCase().trim();
  const a = (area ?? "").toLowerCase();

  if (c.includes("mumbai") || c.includes("bombay")) {
    if (/bandra|juhu|worli|prabhadevi|khar|santacruz/.test(a)) return "mumbai-bandra";
    if (/fort|colaba|nariman|cuffe|churchgate|malabar/.test(a)) return "mumbai-south";
    if (/thane/.test(a)) return "mumbai-thane";
    if (/navi|kharghar|panvel|nerul|vashi|airoli/.test(a)) return "mumbai-navi";
    return "mumbai-suburbs";
  }
  if (c.includes("bangalore") || c.includes("bengaluru")) return "bangalore";
  if (c.includes("gurgaon") || c.includes("gurugram")) return "gurgaon";
  return c.split(/\s+/)[0];
}

export const AVMResponseSchema = z.object({
  estimatedLow: z.number().positive(),
  estimatedHigh: z.number().positive(),
  pricePerSqftLow: z.number().positive(),
  pricePerSqftHigh: z.number().positive(),
  confidence: z.number().min(0).max(100),
  bullCase: z.array(z.string()).min(1),
  bearCase: z.array(z.string()).min(0),
  marketSentiment: z.enum(["bullish", "neutral", "bearish"]),
  rentalYield: z.string(),
  summary: z.string(),
});

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

  const parsed = AVMResponseSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      valid: false,
      data: null,
      warnings: [
        "AI response did not match expected schema.",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...parsed.error.issues.map((e: any) => `${String(e.path.join("."))}: ${e.message}`),
      ],
      clamped: false,
    };
  }

  const data = { ...parsed.data };
  const cityKey = getCityKey(city, area);
  const benchmark = CITY_BENCHMARKS[cityKey];

  if (!benchmark) {
    warnings.push(`No benchmark data on file for "${city}" — price not validated`);
    return { valid: true, data, warnings, clamped };
  }

  const BUFFER = 0.20;
  const minAllowed = benchmark.min * (1 - BUFFER);
  const maxAllowed = benchmark.max * (1 + BUFFER);

  if (data.pricePerSqftLow < minAllowed) {
    warnings.push(
      `Price suspiciously low: ₹${data.pricePerSqftLow}/sqft vs expected ₹${benchmark.min}–${benchmark.max}/sqft in ${benchmark.label}. Adjusted upward.`
    );
    data.pricePerSqftLow = Math.round(benchmark.min * 0.9);
    clamped = true;
  }

  if (data.pricePerSqftHigh > maxAllowed) {
    warnings.push(
      `Price suspiciously high: ₹${data.pricePerSqftHigh}/sqft vs expected ₹${benchmark.min}–${benchmark.max}/sqft in ${benchmark.label}. Adjusted downward.`
    );
    data.pricePerSqftHigh = Math.round(benchmark.max * 1.1);
    clamped = true;
  }

  if (clamped) {
    data.confidence = Math.min(data.confidence, 55);
    warnings.push("Confidence score reduced — price correction applied based on verified market benchmarks.");
  }

  return { valid: true, data, warnings, clamped };
}
