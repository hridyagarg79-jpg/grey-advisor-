"use client";

import { useState } from "react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Calculator, ChevronRight } from "lucide-react";
import Link from "next/link";

function formatINR(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function calcEMI(principal: number, ratePercent: number, years: number) {
  const r = ratePercent / 12 / 100;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const PRESETS = [
  { label: "₹30.0 L", value: 3000000 },
  { label: "₹50.0 L", value: 5000000 },
  { label: "₹1.00 Cr", value: 10000000 },
  { label: "₹2.00 Cr", value: 20000000 },
];

export default function EMICalculatorPage() {
  const [loan, setLoan] = useState(5000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  const emi = calcEMI(loan, rate, tenure);
  const totalPayment = emi * tenure * 12;
  const totalInterest = totalPayment - loan;
  const principalPct = Math.round((loan / totalPayment) * 100);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-14 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 mb-5">
            <Calculator size={24} />
          </div>
          <h1 className="text-4xl font-bold text-stone-900 mb-3">
            EMI <span className="text-gradient">Calculator</span>
          </h1>
          <p className="text-stone-500">Estimate your monthly home loan instalment instantly.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Controls */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-7 space-y-7">

            {/* Loan Amount */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-stone-700">Loan Amount</label>
                <span className="text-sm font-bold text-amber-700">{formatINR(loan)}</span>
              </div>
              <input
                type="range" min={500000} max={50000000} step={100000}
                value={loan} onChange={(e) => setLoan(Number(e.target.value))}
                className="w-full h-1.5 rounded-full accent-amber-700 bg-stone-200 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-stone-400 mt-1"><span>₹5L</span><span>₹5 Cr</span></div>
            </div>

            {/* Interest Rate */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-stone-700">Interest Rate (p.a.)</label>
                <span className="text-sm font-bold text-amber-700">{rate.toFixed(1)}%</span>
              </div>
              <input
                type="range" min={6} max={16} step={0.1}
                value={rate} onChange={(e) => setRate(Number(e.target.value))}
                className="w-full h-1.5 rounded-full accent-amber-700 bg-stone-200 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-stone-400 mt-1"><span>6%</span><span>16%</span></div>
            </div>

            {/* Tenure */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-stone-700">Loan Tenure</label>
                <span className="text-sm font-bold text-amber-700">{tenure} years</span>
              </div>
              <input
                type="range" min={1} max={30} step={1}
                value={tenure} onChange={(e) => setTenure(Number(e.target.value))}
                className="w-full h-1.5 rounded-full accent-amber-700 bg-stone-200 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-stone-400 mt-1"><span>1 yr</span><span>30 yrs</span></div>
            </div>

            {/* Presets */}
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Quick Presets</p>
              <div className="flex gap-2 flex-wrap">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setLoan(p.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      loan === p.value
                        ? "bg-amber-700 text-white border-amber-700"
                        : "border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-7 flex flex-col">
            <div className="text-center mb-6 flex-1 flex flex-col items-center justify-center">
              <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-3">Monthly EMI</p>
              <div className="text-5xl font-bold text-stone-900 mb-1 tabular-nums">
                ₹<NumberTicker value={Math.round(emi)} className="text-stone-900" />
              </div>
              <p className="text-xs text-stone-400">per month for {tenure} years</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-stone-50 rounded-xl p-4 text-center">
                <p className="text-xs text-stone-500 mb-1 uppercase tracking-wide">Principal</p>
                <p className="text-base font-bold text-stone-800">{formatINR(loan)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-xs text-stone-500 mb-1 uppercase tracking-wide">Total Interest</p>
                <p className="text-base font-bold text-red-600">{formatINR(totalInterest)}</p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 text-center mb-5">
              <p className="text-xs text-stone-500 mb-1 uppercase tracking-wide">Total Payment</p>
              <p className="text-xl font-bold text-amber-800">{formatINR(totalPayment)}</p>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-stone-500 mb-1.5">
                <span>Principal share</span><span>{principalPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-red-100 overflow-hidden">
                <div className="h-full rounded-full bg-amber-600 transition-all" style={{ width: `${principalPct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-stone-400 mt-1.5">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />Principal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-300 inline-block" />Interest</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link href="/map" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors">
            Browse Properties <ChevronRight size={15} />
          </Link>
          <Link href="/concierge" className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-stone-200 text-stone-700 text-sm font-medium hover:border-amber-400 hover:text-amber-700 transition-colors">
            Ask Grey AI
          </Link>
        </div>
      </div>
    </div>
  );
}
