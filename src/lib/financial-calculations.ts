// lib/financial-calculations.ts
// Indian Real Estate Financial Intelligence — 2026 Tax Framework

// ─── Yield Calculations ───────────────────────────────────────────────────────

export function calculateGRY(priceRs: number, monthlyRentRs: number): number {
  if (priceRs <= 0) return 0;
  return parseFloat(((monthlyRentRs * 12) / priceRs * 100).toFixed(2));
}

export function calculateNRY(
  priceRs: number,
  monthlyRentRs: number,
  sqft: number,
  city: string
): number {
  if (priceRs <= 0) return 0;
  const annualRent = monthlyRentRs * 12;
  // Maintenance rates ₹/sqft/month by city
  const maintenanceRates: Record<string, number> = {
    mumbai: 8, "navi mumbai": 6, thane: 6,
    pune: 5, bangalore: 6, hyderabad: 4,
    chennai: 4, delhi: 5, gurgaon: 6, noida: 4,
    nagpur: 3, nashik: 3, indore: 3, bhopal: 3,
  };
  const rate = maintenanceRates[city.toLowerCase()] ?? 4;
  const maintenance = rate * sqft * 12;
  const propertyTax = priceRs * 0.005;         // ~0.5% annually
  const vacancy = annualRent * 0.09;           // 9% vacancy
  const totalExpenses = maintenance + propertyTax + vacancy;
  return parseFloat((((annualRent - totalExpenses) / priceRs) * 100).toFixed(2));
}

export function calculateGRM(priceRs: number, monthlyRentRs: number): number {
  if (monthlyRentRs <= 0) return 0;
  return parseFloat((priceRs / (monthlyRentRs * 12)).toFixed(1));
}

// ─── EMI Calculation ─────────────────────────────────────────────────────────

export function calculateEMI(
  principalRs: number,
  annualRatePercent: number,
  tenureYears: number
): { emi: number; totalPayment: number; totalInterest: number } {
  const r = annualRatePercent / 12 / 100; // monthly rate
  const n = tenureYears * 12;              // total months
  if (r === 0) {
    const emi = principalRs / n;
    return { emi, totalPayment: principalRs, totalInterest: 0 };
  }
  const emi = (principalRs * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = emi * n;
  return {
    emi: Math.round(emi),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalPayment - principalRs),
  };
}

// ─── ROI Calculation (5-year) ─────────────────────────────────────────────────

export function calculateTotalROI(params: {
  priceRs: number;
  downPaymentRs: number;
  monthlyRentRs: number;
  sqft: number;
  city: string;
  annualAppreciationPercent?: number;
  holdingYears?: number;
}): {
  totalReturnRs: number;
  totalROIPercent: number;
  rentalIncome5yr: number;
  appreciation: number;
  purchaseCost: number;
} {
  const {
    priceRs,
    downPaymentRs,
    monthlyRentRs,
    sqft,
    city,
    annualAppreciationPercent = 8,
    holdingYears = 5,
  } = params;

  const nry = calculateNRY(priceRs, monthlyRentRs, sqft, city) / 100;

  // Rental income with 5% annual escalation
  let rentalIncome = 0;
  let annualRent = monthlyRentRs * 12 * (1 - 0.09); // net of vacancy
  for (let i = 0; i < holdingYears; i++) {
    rentalIncome += annualRent;
    annualRent *= 1.05; // 5% escalation per year
  }

  const appreciation = priceRs * (Math.pow(1 + annualAppreciationPercent / 100, holdingYears) - 1);
  const purchaseCost = priceRs * 0.06; // ~6% stamp duty+registration+brokerage
  const totalReturn = rentalIncome + appreciation - purchaseCost;
  const roiPercent = (totalReturn / downPaymentRs) * 100;

  return {
    totalReturnRs: Math.round(totalReturn),
    totalROIPercent: parseFloat(roiPercent.toFixed(1)),
    rentalIncome5yr: Math.round(rentalIncome),
    appreciation: Math.round(appreciation),
    purchaseCost: Math.round(purchaseCost),
  };
}

// ─── LTCG Tax 2026 ────────────────────────────────────────────────────────────

export function calculateLTCG(
  purchasePriceRs: number,
  salePriceRs: number,
  purchaseDateStr: string
): {
  gain: number;
  taxAmount: number;
  taxRate: number;
  regime: string;
  netProfit: number;
} {
  const gain = salePriceRs - purchasePriceRs;
  if (gain <= 0) {
    return { gain, taxAmount: 0, taxRate: 0, regime: "No taxable gain", netProfit: gain };
  }

  const purchaseDate = new Date(purchaseDateStr);
  const cutoff = new Date("2024-07-23");
  const isPostCutoff = purchaseDate >= cutoff;

  if (isPostCutoff) {
    const tax = gain * 0.125;
    return {
      gain,
      taxAmount: Math.round(tax),
      taxRate: 12.5,
      regime: "Post Jul-2024 purchase: Flat 12.5% LTCG, no indexation",
      netProfit: Math.round(gain - tax),
    };
  } else {
    // Pre-cutoff: both options allowed, pick lower
    const withoutIndexation = gain * 0.125;
    // Simplified indexation (actual requires CII lookup)
    const withIndexation = gain * 0.20 * 0.7; // rough estimate, 30% indexation benefit
    const tax = Math.min(withoutIndexation, withIndexation);
    const taxRate = tax === withoutIndexation ? 12.5 : 20;
    return {
      gain,
      taxAmount: Math.round(tax),
      taxRate,
      regime: `Pre Jul-2024: ${taxRate}% chosen (better of 12.5% flat or 20%+indexation)`,
      netProfit: Math.round(gain - tax),
    };
  }
}

// ─── GST Calculator ───────────────────────────────────────────────────────────

export function calculateGST(params: {
  priceRs: number;
  isReadyToMove: boolean;
  isAffordableHousing?: boolean; // price <= 45L
}): { gstAmount: number; gstRate: number; note: string } {
  if (params.isReadyToMove) {
    return { gstAmount: 0, gstRate: 0, note: "0% GST — Occupancy Certificate received (ready to move)" };
  }
  if (params.isAffordableHousing && params.priceRs <= 4500000) {
    return { gstAmount: Math.round(params.priceRs * 0.01), gstRate: 1, note: "1% GST — Affordable Housing category" };
  }
  return { gstAmount: Math.round(params.priceRs * 0.05), gstRate: 5, note: "5% GST — Under Construction property" };
}

// ─── Stamp Duty by City ───────────────────────────────────────────────────────

export function calculateStampDuty(
  priceRs: number,
  city: string,
  buyerGender: "male" | "female" | "joint" = "male"
): { stampDuty: number; registration: number; total: number; rate: string } {
  const cityRates: Record<string, { sd: number; sdF?: number; reg: number; note: string }> = {
    mumbai:    { sd: 0.05, sdF: 0.04, reg: 0.01, note: "5% (women: 4%) + 1% Metro cess included" },
    pune:      { sd: 0.06, reg: 0.01, note: "6% + 1% LBT" },
    bangalore: { sd: 0.056, reg: 0.01, note: "5.6% (incl. 0.6% cess)" },
    hyderabad: { sd: 0.04, reg: 0.005, note: "4% + 0.5% Transfer Duty" },
    chennai:   { sd: 0.07, reg: 0.01, note: "7% + surcharge, 1% reg" },
    delhi:     { sd: 0.06, sdF: 0.04, reg: 0.01, note: "6% (women: 4%)" },
    gurgaon:   { sd: 0.05, reg: 0.005, note: "5% stamp + 0.5% reg" },
    noida:     { sd: 0.05, reg: 0.01, note: "5% UP stamp duty" },
  };

  const key = city.toLowerCase().replace(/\s+/g, "");
  const rates = cityRates[key] ?? { sd: 0.05, reg: 0.01, note: "Default 5% stamp duty" };
  const sdRate = (buyerGender === "female" && rates.sdF) ? rates.sdF : rates.sd;
  const stampDuty = Math.round(priceRs * sdRate);
  const registration = Math.round(priceRs * rates.reg);

  return {
    stampDuty,
    registration,
    total: stampDuty + registration,
    rate: rates.note,
  };
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export function formatIndianCurrency(amountRs: number): string {
  if (amountRs >= 10000000) return `₹${(amountRs / 10000000).toFixed(2)} Cr`;
  if (amountRs >= 100000) return `₹${(amountRs / 100000).toFixed(2)} L`;
  return `₹${amountRs.toLocaleString("en-IN")}`;
}
