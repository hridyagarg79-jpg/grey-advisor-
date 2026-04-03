"use client";

import { NumberTicker } from "@/components/ui/number-ticker";
import { TrendingUp, TrendingDown, Activity, BarChart2, MapPin, ArrowRight, Zap, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const HEADLINE_STATS = [
  { label: "Avg Price/Sqft (Mumbai)", value: 24500, prefix: "₹", suffix: "", trend: "+4.2%", up: true },
  { label: "Rental Yield (Bangalore)", value: 4.8, prefix: "", suffix: "%", trend: "+0.3%", up: true },
  { label: "Inventory Absorption", value: 85, prefix: "", suffix: "%", trend: "Steady", up: true },
  { label: "New Launches (Q1 2026)", value: 3840, prefix: "", suffix: " units", trend: "+12%", up: true },
];

const CITY_MARKETS = [
  {
    city: "Mumbai",
    flag: "🏙️",
    avgSqft: 28400,
    yoy: "+5.1%",
    yoyUp: true,
    rentalYield: 3.2,
    hotArea: "Bandra West",
    hotScore: 92,
    color: "amber",
    insight: "Sea-view premiums at all-time high post coastal road",
  },
  {
    city: "Bangalore",
    flag: "🌿",
    avgSqft: 11200,
    yoy: "+7.3%",
    yoyUp: true,
    rentalYield: 4.8,
    hotArea: "Whitefield",
    hotScore: 89,
    color: "emerald",
    insight: "IT corridor driving 15-yr high demand in East Bangalore",
  },
  {
    city: "Pune",
    flag: "🏛️",
    avgSqft: 7800,
    yoy: "+6.2%",
    yoyUp: true,
    rentalYield: 5.1,
    hotArea: "Baner-Balewadi",
    hotScore: 87,
    color: "blue",
    insight: "Highest rental yield city in India for 2 BHK segment",
  },
  {
    city: "Hyderabad",
    flag: "💎",
    avgSqft: 8500,
    yoy: "+3.8%",
    yoyUp: true,
    rentalYield: 3.9,
    hotArea: "Gachibowli",
    hotScore: 84,
    color: "purple",
    insight: "Global tech HQs driving WFH-era demand near HITEC City",
  },
  {
    city: "Delhi NCR",
    flag: "🏢",
    avgSqft: 6200,
    yoy: "+2.1%",
    yoyUp: true,
    rentalYield: 2.8,
    hotArea: "Dwarka Expressway",
    hotScore: 78,
    color: "rose",
    insight: "Infrastructure PMI at all-time high with metro connectivity",
  },
];

const MICRO_MARKETS = [
  { city: "Mumbai", area: "Bandra West", score: 92, tag: "Premium", price: "₹45K/sqft", type: "buy", yoy: "+5.8%" },
  { city: "Pune", area: "Baner", score: 88, tag: "High Yield", price: "₹7,800/mo rent", type: "rent", yoy: "+6.4%" },
  { city: "Bangalore", area: "Whitefield", score: 85, tag: "IT Hub", price: "₹11K/sqft", type: "buy", yoy: "+7.2%" },
  { city: "Hyderabad", area: "Gachibowli", score: 87, tag: "Growth", price: "₹8.5K/sqft", type: "invest", yoy: "+4.1%" },
  { city: "Delhi NCR", area: "Dwarka Exp.", score: 79, tag: "Infra Play", price: "₹6.2K/sqft", type: "buy", yoy: "+3.3%" },
  { city: "Mumbai", area: "Thane West", score: 82, tag: "Emerging", price: "₹14K/sqft", type: "invest", yoy: "+4.9%" },
  { city: "Pune", area: "Hinjewadi", score: 84, tag: "Tech Zone", price: "₹6.5K/sqft", type: "buy", yoy: "+5.5%" },
  { city: "Bangalore", area: "Sarjapur Rd", score: 80, tag: "Upcoming", price: "₹8.8K/sqft", type: "invest", yoy: "+6.9%" },
];

const SEGMENT_PERFORMANCE = [
  { label: "Luxury (₹5Cr+)", performance: 78, change: "+8.4%", color: "bg-amber-700" },
  { label: "Premium (₹1.5-5Cr)", performance: 85, change: "+6.2%", color: "bg-amber-600" },
  { label: "Mid (₹60L-1.5Cr)", performance: 92, change: "+5.1%", color: "bg-emerald-600" },
  { label: "Affordable (<₹60L)", performance: 65, change: "+2.8%", color: "bg-stone-500" },
];

const TYPE_TAGS: Record<string, string> = {
  buy: "bg-amber-50 text-amber-700",
  rent: "bg-emerald-50 text-emerald-700",
  invest: "bg-blue-50 text-blue-700",
};

export default function TrendsPage() {
  const [activeCity, setActiveCity] = useState("All");
  const cities = ["All", ...CITY_MARKETS.map((c) => c.city)];
  const filtered = activeCity === "All"
    ? MICRO_MARKETS
    : MICRO_MARKETS.filter((m) => m.city === activeCity);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-14 px-4 bg-stone-50">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold mb-4">
            <Zap size={11} className="fill-amber-500" />
            Live Market Intelligence — Q1 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4">
            Market Trends <span className="text-gradient">& Analytics</span>
          </h1>
          <p className="text-stone-500 max-w-2xl mx-auto">
            Prices, yields, and absorption rates across major Indian real estate markets — updated monthly by Grey AI.
          </p>
        </div>

        {/* ── Headline Stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {HEADLINE_STATS.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 text-center flex flex-col items-center justify-center hover:shadow-md transition-shadow"
            >
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">{stat.label}</p>
              <div className="text-3xl lg:text-4xl font-bold text-stone-900 mb-2 tabular-nums">
                {stat.prefix}
                <NumberTicker
                  value={stat.value}
                  decimalPlaces={stat.value % 1 !== 0 ? 1 : 0}
                  className="text-stone-900 tracking-tight"
                />
                {stat.suffix}
              </div>
              <span className={cn(
                "text-xs font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-full",
                stat.up ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"
              )}>
                {stat.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {stat.trend}
              </span>
            </div>
          ))}
        </div>

        {/* ── City Market Cards ───────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <Globe size={18} className="text-amber-700" />
              City Market Snapshots
            </h2>
            <span className="text-xs text-stone-400">Updated Apr 2026</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {CITY_MARKETS.map((market) => (
              <div
                key={market.city}
                className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 hover:border-amber-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{market.flag}</span>
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    market.yoyUp ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"
                  )}>
                    {market.yoy}
                  </span>
                </div>
                <h3 className="font-bold text-stone-900 mb-1">{market.city}</h3>
                <p className="text-2xl font-bold text-stone-800 mb-0.5">
                  ₹{market.avgSqft.toLocaleString("en-IN")}
                  <span className="text-xs font-normal text-stone-400 ml-1">/sqft</span>
                </p>
                <p className="text-xs text-stone-500 mb-3">Yield: <span className="font-semibold text-stone-700">{market.rentalYield}%</span></p>
                <div className="pt-3 border-t border-stone-100">
                  <p className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-1">Hot Area</p>
                  <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
                    <MapPin size={10} /> {market.hotArea}
                  </p>
                </div>
                <p className="text-[10px] text-stone-400 mt-2 leading-relaxed">{market.insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Segment Performance ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
              <BarChart2 size={18} className="text-amber-700" />
              Segment Performance Index
            </h2>
            <span className="text-xs text-stone-400">Demand score / 100</span>
          </div>
          <div className="space-y-4">
            {SEGMENT_PERFORMANCE.map((seg) => (
              <div key={seg.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-stone-700">{seg.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-emerald-600">{seg.change}</span>
                    <span className="text-sm font-bold text-stone-800">{seg.performance}</span>
                  </div>
                </div>
                <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000", seg.color)}
                    style={{ width: `${seg.performance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-4">
            Mid-segment properties (₹60L–₹1.5Cr) showing highest absorption nationwide, driven by end-user demand and PMAY incentives.
          </p>
        </div>

        {/* ── Micro-Market Table ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          {/* Filter tabs */}
          <div className="px-6 py-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-stone-800 flex items-center gap-2">
              <MapPin size={18} className="text-amber-700" />
              Top Micro-Markets
            </h2>
            <div className="flex gap-2 flex-wrap">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setActiveCity(city)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold transition-all",
                    activeCity === city
                      ? "bg-amber-700 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  )}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-stone-50">
            {filtered.map((area, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Score badge */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0",
                    area.score >= 88 ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-700"
                  )}>
                    {area.score}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">{area.area}</p>
                    <p className="text-xs text-stone-400">{area.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-5">
                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-medium hidden sm:block",
                    TYPE_TAGS[area.type]
                  )}>
                    {area.tag}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {area.yoy}
                  </span>
                  <span className="text-sm font-bold text-stone-800 whitespace-nowrap">{area.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI Insight CTA ──────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-700/30 text-amber-400 text-xs font-semibold mb-3">
              <Activity size={11} />
              AI-Powered Deep Dive
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Ask Grey AI for Custom Analysis</h2>
            <p className="text-stone-400 text-sm max-w-md">
              "Compare Pune vs Hyderabad for 5-year ROI on a 2BHK" — Get a full investment thesis in seconds.
            </p>
          </div>
          <Link
            href="/concierge"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-amber-700 text-white text-sm font-semibold hover:bg-amber-600 transition-colors whitespace-nowrap flex-shrink-0 shadow-lg shadow-amber-900/30"
          >
            Ask Grey AI <ArrowRight size={15} />
          </Link>
        </div>

        {/* ── Disclaimer ──────────────────────────────────────────────────── */}
        <p className="text-center text-xs text-stone-400 pb-4">
          Data compiled from public registrations, builder disclosures, and AI market synthesis. Not financial advice.
          Always verify with a registered property consultant before investing.
        </p>

      </div>
    </div>
  );
}
