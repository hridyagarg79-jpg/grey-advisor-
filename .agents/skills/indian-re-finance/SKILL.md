---
name: indian-re-finance
description: All financial formulas, tax logic, and yield calculations for the Indian real estate market as of 2026. Use this skill whenever implementing AVM, ROI calculators, or financial analysis features.
---

# Indian Real Estate Financial Intelligence — 2026

## Core Yield Formulas

### 1. Gross Rental Yield (GRY)
```
GRY = (Annual Rent / Property Price) × 100

Example:
  Property Price = ₹1.5 Cr = ₹1,50,00,000
  Monthly Rent   = ₹35,000
  Annual Rent    = ₹4,20,000
  GRY            = (4,20,000 / 1,50,00,000) × 100 = 2.8%
```

### 2. Net Rental Yield (NRY)
```
NRY = ((Annual Rent - Annual Expenses) / Property Price) × 100

Annual Expenses include:
  - Society maintenance (₹4-12/sqft/month in Mumbai, ₹2-6 in Pune/Bangalore)
  - Property tax (0.5-1% of property value annually)
  - Insurance (0.05-0.1% annually)
  - Vacancy allowance (8-10% of annual rent)
  - Management fees if applicable (8-10% of rent)

Example (Mumbai 1,000 sqft flat):
  Annual Rent     = ₹4,20,000
  Maintenance     = ₹8 × 1,000 × 12 = ₹96,000
  Property Tax    = ₹75,000
  Vacancy (9%)    = ₹37,800
  Total Expenses  = ₹2,08,800
  NRY             = ((4,20,000 - 2,08,800) / 1,50,00,000) × 100 = 1.41%
```

### 3. Gross Rent Multiplier (GRM)
```
GRM = Property Price / Annual Gross Rent

Lower GRM = better investment (faster payback)
Indian residential benchmark: GRM of 20-35 is typical
GRM < 20 = undervalued / high yield
GRM > 40 = overvalued / low yield

Example:
  Price = ₹90 L, Annual Rent = ₹3,60,000
  GRM   = 90,00,000 / 3,60,000 = 25
```

### 4. Total ROI (5-year horizon)
```
Total ROI = ((Rental Income 5yr + Appreciation - Purchase Costs) / Investment) × 100

Components:
  Rental Income 5yr = NRY × Price × 5 (with 5% annual escalation)
  Appreciation      = Price × (1 + appreciation_rate)^5 - Price
  Purchase Costs    = Stamp duty + Registration + Brokerage + GST (if applicable)
  Investment        = Down Payment (typically 20-25% of price)

Example:
  Price             = ₹1 Cr, Down Payment = ₹25 L
  Annual Rent       = ₹2,40,000 (NRY ~2.4%)
  5yr Rental        = ₹13,20,000 (with 5% escalation)
  Appreciation 8%   = ₹1,46,93,000 - ₹1,00,00,000 = ₹46,93,000
  Purchase Costs    = ₹5,00,000 (stamp 3% + reg 1% + brokerage 1%)
  Total Return      = ₹13,20,000 + ₹46,93,000 - ₹5,00,000 = ₹55,13,000
  ROI               = (55,13,000 / 25,00,000) × 100 = 220.5% over 5 years
```

## 2026 Indian Tax Framework

### Long-Term Capital Gains (LTCG)
```
Holding period: > 24 months = Long Term (reduced from 36 months in 2024 budget)

For properties PURCHASED BEFORE July 23, 2024:
  - Option A: 20% with indexation (CII-based)
  - Option B: 12.5% WITHOUT indexation
  - Choose whichever gives lower tax

For properties PURCHASED AFTER July 23, 2024:
  - FLAT 12.5% WITHOUT indexation (no choice)
  - No indexation benefit available

LTCG Exemption (Section 54):
  - Reinvest in ONE residential property within 2 years (or construct within 3 years)
  - Invest in Capital Gains Bonds (54EC) up to ₹50 L within 6 months

STCG (< 24 months):
  - Added to income, taxed at applicable slab rate
```

### GST Rules 2026
```
Under Construction Property:  5% GST (no ITC to buyer)
Affordable Housing (<₹45L):   1% GST
Ready-to-Move (OC received):   0% GST ← KEY BUYER ADVANTAGE
Commercial Property:           12% GST

Note: Stamp duty is levied SEPARATELY and not affected by GST
```

### Stamp Duty by City (2026 reference)
```
Mumbai:       5% (women: 4%) + 1% Metro cess
Pune:         6% + 1% Local Body Tax
Bangalore:    5.6% (0.6% cess)
Hyderabad:    4% + 0.5% cess
Chennai:      7% + 4% surcharge
Delhi:        6% (women: 4%)
```

## TypeScript Implementation
```typescript
// lib/financial-calculations.ts

export interface PropertyFinancials {
  price: number;          // in rupees
  monthlyRent: number;    // in rupees
  sqft: number;
  city: string;
  purchaseDate?: string;  // ISO date
}

export function calculateGRY(price: number, monthlyRent: number): number {
  return ((monthlyRent * 12) / price) * 100;
}

export function calculateNRY(price: number, monthlyRent: number, sqft: number, city: string): number {
  const annualRent = monthlyRent * 12;
  // Maintenance cost per city (₹/sqft/month)
  const maintenanceRate: Record<string, number> = {
    mumbai: 8, pune: 5, bangalore: 6, hyderabad: 4, chennai: 4, delhi: 5
  };
  const rate = maintenanceRate[city.toLowerCase()] ?? 5;
  const maintenance = rate * sqft * 12;
  const propertyTax = price * 0.005;
  const vacancy = annualRent * 0.09;
  const totalExpenses = maintenance + propertyTax + vacancy;
  return ((annualRent - totalExpenses) / price) * 100;
}

export function calculateGRM(price: number, monthlyRent: number): number {
  return price / (monthlyRent * 12);
}

export function calculateLTCG(
  purchasePrice: number,
  salePrice: number,
  purchaseDateStr: string
): { taxAmount: number; taxRate: number; regime: string } {
  const purchaseDate = new Date(purchaseDateStr);
  const cutoffDate = new Date("2024-07-23");
  const gain = salePrice - purchasePrice;
  if (gain <= 0) return { taxAmount: 0, taxRate: 0, regime: "No gain" };

  const isPostCutoff = purchaseDate >= cutoffDate;
  if (isPostCutoff) {
    return { taxAmount: gain * 0.125, taxRate: 12.5, regime: "Post Jul-2024: Flat 12.5% no indexation" };
  }
  // Pre-cutoff: simplified (ignore CII for now, compare both options)
  const withIndexation = gain * 0.20;   // simplified
  const withoutIndexation = gain * 0.125;
  const lower = Math.min(withIndexation, withoutIndexation);
  return { taxAmount: lower, taxRate: lower === withoutIndexation ? 12.5 : 20, regime: "Pre Jul-2024: Best of 20%+indexation or 12.5%" };
}

export function calculateGST(price: number, isReadyToMove: boolean, isAffordable: boolean): number {
  if (isReadyToMove) return 0;
  if (isAffordable && price <= 4500000) return price * 0.01;
  return price * 0.05;
}
```

## Benchmark Ranges (2026)
| City | Tier | Avg ₹/sqft | Typical GRY | Typical NRY |
|---|---|---|---|---|
| Mumbai (Bandra, Juhu) | 1 | ₹35,000–60,000 | 1.8–2.5% | 0.8–1.5% |
| Mumbai (Thane, Navi) | 1 | ₹8,000–15,000 | 2.5–3.5% | 1.5–2.5% |
| Pune (Koregaon, Baner) | 1 | ₹10,000–18,000 | 3.0–4.0% | 2.0–3.0% |
| Bangalore (Indiranagar) | 1 | ₹12,000–20,000 | 3.2–4.5% | 2.0–3.2% |
| Hyderabad (Jubilee) | 1 | ₹8,000–16,000 | 3.5–5.0% | 2.5–3.8% |
| Nagpur | 2 | ₹4,000–8,000 | 4.0–6.0% | 3.0–4.5% |
| Nashik | 2 | ₹3,500–6,000 | 4.5–6.5% | 3.5–5.0% |
| Indore | 2 | ₹4,500–9,000 | 4.0–5.5% | 3.0–4.5% |

## Price Validation Guardrail
```typescript
import { z } from "zod";

// City-level ₹/sqft benchmarks (min, max) — update quarterly
const PRICE_BENCHMARKS: Record<string, [number, number]> = {
  "mumbai-central": [25000, 65000],
  "mumbai-suburbs": [7000, 18000],
  "pune": [5500, 20000],
  "bangalore": [7000, 22000],
  "hyderabad": [5000, 18000],
  "chennai": [6000, 16000],
  "delhi-ncr": [5000, 20000],
  "nagpur": [3500, 9000],
  "nashik": [3000, 7000],
  "indore": [4000, 10000],
};

export function validatePricePerSqft(
  pricePerSqft: number,
  cityKey: string
): { valid: boolean; warning?: string } {
  const range = PRICE_BENCHMARKS[cityKey];
  if (!range) return { valid: true }; // unknown city, pass through
  const [min, max] = range;
  const buffer = 0.15; // 15% guardrail
  if (pricePerSqft < min * (1 - buffer) || pricePerSqft > max * (1 + buffer)) {
    return {
      valid: false,
      warning: `Price ₹${pricePerSqft}/sqft is outside expected range ₹${min}–₹${max}/sqft for ${cityKey}. Data may be inaccurate.`
    };
  }
  return { valid: true };
}
```
