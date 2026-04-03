"use client";

import { useState } from "react";
import { TrendingUp, Building2, AlertTriangle, CheckCircle, Loader2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const CITIES = ["Mumbai", "Pune", "Bangalore", "Delhi", "Hyderabad", "Chennai", "Ahmedabad", "Kolkata"];
const TYPES = ["Flat / Apartment", "Independent House", "Villa", "PG / Co-living", "Plot"];

interface Valuation {
  estimatedLow: number;
  estimatedHigh: number;
  pricePerSqftLow: number;
  pricePerSqftHigh: number;
  confidence: number;
  bullCase: string[];
  bearCase: string[];
  marketSentiment: "bullish" | "neutral" | "bearish";
  rentalYield: string;
  summary: string;
}

function formatLakhs(val: number) {
  if (val >= 100) return `₹${(val / 100).toFixed(1)} Cr`;
  return `₹${val}L`;
}

const SENTIMENT_CONFIG = {
  bullish: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "🟢 Bullish" },
  neutral: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "🟡 Neutral" },
  bearish: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "🔴 Bearish" },
};

export default function AVMPage() {
  const [form, setForm] = useState({ city: "", area: "", type: "Flat / Apartment", bedrooms: "2", sqft: "", age: "" });
  const [loading, setLoading] = useState(false);
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setValuation(null);
    setError(null);
  }

  const isValid = form.city && form.sqft && Number(form.sqft) > 0;

  async function handleValuate() {
    if (!isValid) return;
    setLoading(true);
    setError(null);
    setValuation(null);
    try {
      const res = await fetch("/api/avm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: form.city,
          area: form.area || undefined,
          type: form.type,
          bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
          sqft: Number(form.sqft),
          age: form.age ? Number(form.age) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Valuation failed");
      setValuation(data.valuation);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const sentiment = valuation ? SENTIMENT_CONFIG[valuation.marketSentiment] ?? SENTIMENT_CONFIG.neutral : null;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-14 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 mb-5">
            <BarChart3 size={24} />
          </div>
          <h1 className="text-4xl font-bold text-stone-900 mb-3">
            AI Property <span className="text-gradient">Valuation</span>
          </h1>
          <p className="text-stone-500 max-w-md mx-auto">
            Enter your property details and our AI will estimate the current market value based on Indian micro-market trends.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 md:p-8 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* City */}
            <div>
              <label className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-2 block">City *</label>
              <select
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
              >
                <option value="">Select city…</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-2 block">Neighbourhood / Area</label>
              <input
                type="text"
                value={form.area}
                onChange={(e) => setField("area", e.target.value)}
                placeholder="e.g. Bandra, Koregaon Park…"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-2 block">Property Type</label>
              <select
                value={form.type}
                onChange={(e) => setField("type", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
              >
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* BHK */}
            <div>
              <label className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-2 block">Bedrooms (BHK)</label>
              <div className="flex gap-2">
                {["1", "2", "3", "4", "5+"].map((b) => (
                  <button
                    key={b}
                    onClick={() => setField("bedrooms", b)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                      form.bedrooms === b
                        ? "bg-amber-700 text-white border-amber-700"
                        : "border-stone-200 text-stone-600 hover:border-amber-300 bg-stone-50"
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Sqft */}
            <div>
              <label className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-2 block">Built-up Area (sqft) *</label>
              <input
                type="number"
                value={form.sqft}
                onChange={(e) => setField("sqft", e.target.value)}
                placeholder="e.g. 950"
                min="100"
                max="10000"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Age */}
            <div>
              <label className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-2 block">Age of Building (years)</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setField("age", e.target.value)}
                placeholder="e.g. 5"
                min="0"
                max="100"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleValuate}
            disabled={!isValid || loading}
            className={cn(
              "w-full mt-7 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
              isValid && !loading
                ? "bg-amber-700 text-white hover:bg-amber-800 shadow-sm shadow-amber-900/15"
                : "bg-stone-100 text-stone-400 cursor-not-allowed"
            )}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                AI is analysing market data…
              </>
            ) : (
              <>
                <TrendingUp size={16} />
                Get Valuation
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-5 mb-6 flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Valuation failed</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Skeleton Loader */}
        {loading && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 md:p-8 animate-pulse space-y-5">
            <div className="h-5 w-40 bg-stone-100 rounded-full" />
            <div className="h-16 w-full bg-stone-100 rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-stone-100 rounded-2xl" />
              <div className="h-20 bg-stone-100 rounded-2xl" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-stone-100 rounded-full" />)}
            </div>
          </div>
        )}

        {/* Valuation Report */}
        {!loading && valuation && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">

            {/* Estimated Value Banner */}
            <div className="bg-gradient-to-r from-amber-700 to-amber-600 p-6 md:p-8">
              <p className="text-amber-200 text-xs font-semibold tracking-widest uppercase mb-2 flex items-center gap-2">
                <Building2 size={12} />
                AI Estimated Market Value
              </p>
              <p className="text-4xl md:text-5xl font-bold text-white mb-1">
                {formatLakhs(valuation.estimatedLow)} – {formatLakhs(valuation.estimatedHigh)}
              </p>
              <p className="text-amber-200 text-sm">
                ₹{valuation.pricePerSqftLow.toLocaleString()} – ₹{valuation.pricePerSqftHigh.toLocaleString()} per sqft
              </p>
            </div>

            <div className="p-6 md:p-8 space-y-6">

              {/* Confidence + Sentiment Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Confidence */}
                <div className="flex-1 bg-stone-50 rounded-2xl p-4">
                  <p className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-2">AI Confidence</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-600 transition-all duration-1000"
                        style={{ width: `${valuation.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-stone-800">{valuation.confidence}%</span>
                  </div>
                </div>

                {/* Sentiment */}
                {sentiment && (
                  <div className={cn("flex-1 rounded-2xl p-4 border", sentiment.bg, sentiment.border)}>
                    <p className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-2">Market Sentiment</p>
                    <p className={cn("text-sm font-bold", sentiment.color)}>{sentiment.label}</p>
                  </div>
                )}

                {/* Rental Yield */}
                {valuation.rentalYield && (
                  <div className="flex-1 bg-stone-50 rounded-2xl p-4">
                    <p className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-2">Est. Rental Yield</p>
                    <p className="text-sm font-bold text-stone-800">{valuation.rentalYield}</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              {valuation.summary && (
                <div className="bg-stone-50 rounded-2xl p-4 border-l-4 border-amber-600">
                  <p className="text-sm text-stone-700 leading-relaxed italic">"{valuation.summary}"</p>
                </div>
              )}

              {/* Bull & Bear */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bull Case */}
                <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
                  <p className="text-[10px] font-semibold tracking-widest text-emerald-700 uppercase mb-3 flex items-center gap-1.5">
                    <CheckCircle size={11} />
                    Bull Case
                  </p>
                  <ul className="space-y-2">
                    {(valuation.bullCase || []).map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bear Case */}
                <div className="bg-red-50 rounded-2xl border border-red-100 p-4">
                  <p className="text-[10px] font-semibold tracking-widest text-red-600 uppercase mb-3 flex items-center gap-1.5">
                    <AlertTriangle size={11} />
                    Risk Factors
                  </p>
                  {(valuation.bearCase || []).length === 0 ? (
                    <p className="text-sm text-stone-500 italic">No major risk factors identified.</p>
                  ) : (
                    <ul className="space-y-2">
                      {(valuation.bearCase || []).map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[11px] text-stone-400 text-center leading-relaxed">
                ⚠️ This valuation is AI-generated for advisory purposes only. Actual property prices may vary. Consult a registered property consultant before making investment decisions.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
