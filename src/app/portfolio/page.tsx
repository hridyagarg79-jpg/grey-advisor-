"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2, TrendingUp, TrendingDown, Plus, X,
  BarChart3, MapPin, Calendar, IndianRupee, ChevronRight,
  PiggyBank, Landmark, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PortfolioEntry {
  id: string;
  name: string;
  city: string;
  area: string;
  type: string;
  purchasePrice: number; // in lakhs
  currentPrice: number;  // in lakhs
  purchaseYear: number;
  bedrooms?: number;
  sqft?: number;
  monthlyRent?: number; // in ₹
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatINR(val: number) {
  if (val >= 100) return `₹${(val / 100).toFixed(2)} Cr`;
  return `₹${val.toFixed(1)} L`;
}

function calcROI(purchase: number, current: number) {
  return ((current - purchase) / purchase) * 100;
}

function calcCAGR(purchase: number, current: number, years: number) {
  if (years <= 0) return 0;
  return (Math.pow(current / purchase, 1 / years) - 1) * 100;
}

function calcGrossYield(currentPriceLakhs: number, monthlyRent: number) {
  const annualRent = monthlyRent * 12;
  return (annualRent / (currentPriceLakhs * 100000)) * 100;
}

// ─── Dummy starter data ────────────────────────────────────────────────────────
const SAMPLE_ENTRIES: PortfolioEntry[] = [
  {
    id: "1",
    name: "Lodha Amara",
    city: "Mumbai",
    area: "Thane West",
    type: "Apartment",
    purchasePrice: 95,
    currentPrice: 130,
    purchaseYear: 2020,
    bedrooms: 2,
    sqft: 850,
    monthlyRent: 28000,
  },
  {
    id: "2",
    name: "VTP Purvanchal",
    city: "Pune",
    area: "Baner",
    type: "Apartment",
    purchasePrice: 62,
    currentPrice: 80,
    purchaseYear: 2021,
    bedrooms: 2,
    sqft: 760,
    monthlyRent: 22000,
  },
];

const CURRENT_YEAR = new Date().getFullYear();

// ─── Add Property Modal ────────────────────────────────────────────────────────
function AddModal({ onAdd, onClose }: { onAdd: (e: PortfolioEntry) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", city: "Mumbai", area: "", type: "Apartment",
    purchasePrice: "", currentPrice: "", purchaseYear: String(CURRENT_YEAR - 2),
    bedrooms: "", sqft: "", monthlyRent: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.purchasePrice || !form.currentPrice) return;
    onAdd({
      id: Date.now().toString(),
      name: form.name,
      city: form.city,
      area: form.area,
      type: form.type,
      purchasePrice: parseFloat(form.purchasePrice),
      currentPrice: parseFloat(form.currentPrice),
      purchaseYear: parseInt(form.purchaseYear),
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
      sqft: form.sqft ? parseInt(form.sqft) : undefined,
      monthlyRent: form.monthlyRent ? parseInt(form.monthlyRent) : undefined,
    });
    onClose();
  }

  const inp = (label: string, field: keyof typeof form, type = "text", placeholder = "") => (
    <div>
      <label className="text-xs font-medium text-stone-600 mb-1 block">{label}</label>
      <input
        type={type}
        value={form[field]}
        onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-stone-900">Add Property</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400"><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            {inp("Project / Property Name *", "name", "text", "e.g. Lodha Amara")}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">City</label>
                <select
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  {["Mumbai","Pune","Bangalore","Hyderabad","Delhi NCR","Chennai"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              {inp("Area / Locality", "area", "text", "e.g. Baner")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {inp("Purchase Price (₹ Lakhs) *", "purchasePrice", "number", "e.g. 75")}
              {inp("Current Market Price (₹ Lakhs) *", "currentPrice", "number", "e.g. 95")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {inp("Year of Purchase", "purchaseYear", "number", "e.g. 2020")}
              {inp("BHK", "bedrooms", "number", "e.g. 2")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {inp("Sqft", "sqft", "number", "e.g. 950")}
              {inp("Monthly Rent (₹, if rented)", "monthlyRent", "number", "e.g. 22000")}
            </div>
            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl bg-amber-700 text-white font-semibold hover:bg-amber-800 transition-colors text-sm"
            >
              Add to Portfolio
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Property Card ─────────────────────────────────────────────────────────────
function PropertyCard({ entry, onRemove }: { entry: PortfolioEntry; onRemove: () => void }) {
  const years = CURRENT_YEAR - entry.purchaseYear;
  const roi = calcROI(entry.purchasePrice, entry.currentPrice);
  const cagr = calcCAGR(entry.purchasePrice, entry.currentPrice, years);
  const gain = entry.currentPrice - entry.purchasePrice;
  const isPositive = gain >= 0;
  const grossYield = entry.monthlyRent ? calcGrossYield(entry.currentPrice, entry.monthlyRent) : null;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 hover:shadow-md hover:border-amber-200 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{entry.type}</span>
            {entry.bedrooms && <span className="text-xs text-stone-500">{entry.bedrooms} BHK</span>}
          </div>
          <h3 className="font-bold text-stone-900 text-base truncate">{entry.name}</h3>
          <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
            <MapPin size={10} />{entry.area}, {entry.city}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors ml-2 flex-shrink-0"
          title="Remove"
        >
          <X size={14} />
        </button>
      </div>

      {/* Price row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-stone-50 rounded-xl p-3">
          <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">Bought at</p>
          <p className="text-sm font-bold text-stone-700">{formatINR(entry.purchasePrice)}</p>
          <p className="text-[10px] text-stone-400 flex items-center gap-0.5 mt-0.5"><Calendar size={9} />{entry.purchaseYear}</p>
        </div>
        <div className="bg-stone-50 rounded-xl p-3">
          <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">Current Value</p>
          <p className="text-sm font-bold text-stone-900">{formatINR(entry.currentPrice)}</p>
          {entry.sqft && <p className="text-[10px] text-stone-400 mt-0.5">₹{Math.round((entry.currentPrice * 100000) / entry.sqft).toLocaleString("en-IN")}/sqft</p>}
        </div>
      </div>

      {/* Returns */}
      <div className={cn("rounded-xl p-3 mb-3", isPositive ? "bg-emerald-50" : "bg-red-50")}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: isPositive ? "#059669" : "#dc2626" }}>
              {isPositive ? "Gain" : "Loss"}
            </p>
            <p className={cn("text-base font-bold", isPositive ? "text-emerald-700" : "text-red-600")}>
              {isPositive ? "+" : ""}{formatINR(Math.abs(gain))}
            </p>
          </div>
          <div className="text-right">
            <p className={cn("text-xl font-bold flex items-center gap-1", isPositive ? "text-emerald-600" : "text-red-500")}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {roi.toFixed(1)}%
            </p>
            <p className="text-[10px] text-stone-400">{cagr.toFixed(1)}% CAGR · {years}y</p>
          </div>
        </div>
      </div>

      {/* Yield */}
      {grossYield !== null && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500">Monthly Rent</span>
          <span className="font-semibold text-stone-700">₹{(entry.monthlyRent ?? 0).toLocaleString("en-IN")}</span>
          <span className="font-bold text-emerald-600">{grossYield.toFixed(2)}% GRY</span>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const [entries, setEntries] = useState<PortfolioEntry[]>(SAMPLE_ENTRIES);
  const [showAdd, setShowAdd] = useState(false);

  const totalInvested = entries.reduce((s, e) => s + e.purchasePrice, 0);
  const totalCurrent = entries.reduce((s, e) => s + e.currentPrice, 0);
  const totalGain = totalCurrent - totalInvested;
  const overallROI = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  const totalMonthlyRent = entries.reduce((s, e) => s + (e.monthlyRent ?? 0), 0);
  const avgGrossYield = totalCurrent > 0 ? ((totalMonthlyRent * 12) / (totalCurrent * 100000)) * 100 : 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold tracking-widest text-amber-700 uppercase mb-1">Your Assets</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 flex items-center gap-3">
              <Building2 className="text-amber-700" size={30} />
              My Portfolio
            </h1>
            <p className="text-stone-500 mt-1">{entries.length} propert{entries.length === 1 ? "y" : "ies"} tracked</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-700 text-white font-semibold text-sm hover:bg-amber-800 transition-colors shadow-sm shadow-amber-900/10"
          >
            <Plus size={16} /> Add Property
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Landmark size={16} className="text-amber-700" />, bg: "bg-amber-50", label: "Total Invested", value: formatINR(totalInvested) },
            {
              icon: overallROI >= 0 ? <TrendingUp size={16} className="text-emerald-600" /> : <TrendingDown size={16} className="text-red-500" />,
              bg: overallROI >= 0 ? "bg-emerald-50" : "bg-red-50",
              label: "Total Gain/Loss",
              value: `${totalGain >= 0 ? "+" : ""}${formatINR(Math.abs(totalGain))}`,
              sub: `${overallROI.toFixed(1)}% overall ROI`,
              color: overallROI >= 0 ? "text-emerald-700" : "text-red-600",
            },
            { icon: <BarChart3 size={16} className="text-violet-600" />, bg: "bg-violet-50", label: "Current Value", value: formatINR(totalCurrent) },
            {
              icon: <PiggyBank size={16} className="text-blue-600" />,
              bg: "bg-blue-50",
              label: "Avg Gross Yield",
              value: `${avgGrossYield.toFixed(2)}%`,
              sub: totalMonthlyRent > 0 ? `₹${(totalMonthlyRent / 1000).toFixed(1)}K/mo rent` : "No rentals tracked",
            },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-3", card.bg)}>{card.icon}</div>
              <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">{card.label}</p>
              <p className={cn("text-lg font-bold", (card as {color?: string}).color ?? "text-stone-900")}>{card.value}</p>
              {(card as {sub?: string}).sub && <p className="text-[10px] text-stone-400 mt-0.5">{(card as {sub: string}).sub}</p>}
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-xs text-amber-800">
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          <p>
            <strong>Note:</strong> Current values are manually entered by you and are estimates. For accurate valuations, use our{" "}
            <Link href="/avm" className="underline font-semibold">AI Valuation Tool</Link>.
            This is not financial advice — consult a registered advisor before making investment decisions.
          </p>
        </div>

        {/* Properties Grid */}
        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-16 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <Building2 className="text-amber-700" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-stone-800 mb-2">No properties yet</h3>
            <p className="text-sm text-stone-500 max-w-sm mb-6">Add your properties to start tracking ROI, appreciation, and rental yield in one place.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors"
            >
              <Plus size={16} /> Add First Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {entries.map((entry) => (
              <PropertyCard
                key={entry.id}
                entry={entry}
                onRemove={() => setEntries((p) => p.filter((e) => e.id !== entry.id))}
              />
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/avm"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors"
          >
            <BarChart3 size={15} /> Get AI Valuation
          </Link>
          <Link
            href="/concierge"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-stone-200 text-stone-700 text-sm font-medium hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
          >
            Ask Grey AI <ChevronRight size={14} />
          </Link>
          <Link
            href="/wishlist"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-stone-200 text-stone-700 text-sm font-medium hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
          >
            <IndianRupee size={14} /> My Wishlist
          </Link>
        </div>
      </div>

      {showAdd && <AddModal onAdd={(e) => setEntries((p) => [...p, e])} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
