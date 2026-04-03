"use client";

import { useState } from "react";
import { MapPin, ArrowRight, ChevronDown, ChevronUp, X } from "lucide-react";
import Link from "next/link";
import SpiderChart from "@/components/SpiderChart";
import { cn } from "@/lib/utils";

interface AreaData {
  name: string;
  city: string;
  tag1: string;
  tag2: string;
  overallScore: number;
  description: string;
  scores: {
    Walkability: number;
    Transit: number;
    Schools: number;
    Safety: number;
  };
  highlights: string[];
  avgPricePerSqft: string;
  yoyGrowth: string;
}

const AREAS: AreaData[] = [
  {
    name: "Baner",
    city: "Pune",
    tag1: "High Yield",
    tag2: "IT Hub",
    overallScore: 88,
    description: "Baner is a thriving IT corridor in Pune known for premium gated communities, excellent social infrastructure, and strong rental demand from tech professionals.",
    scores: { Walkability: 8, Transit: 7, Schools: 9, Safety: 8 },
    highlights: ["Metro Phase 2 inbound", "Avg. 8.2% rental yield", "Top-rated schools within 3km"],
    avgPricePerSqft: "₹9,200",
    yoyGrowth: "+11%",
  },
  {
    name: "Kharadi",
    city: "Pune",
    tag1: "Growth",
    tag2: "Airport Zone",
    overallScore: 82,
    description: "Kharadi is one of Pune's fastest-growing micro-markets, adjacent to the IT parks and 15 min from Pune airport, making it ideal for investment.",
    scores: { Walkability: 7, Transit: 8, Schools: 8, Safety: 7 },
    highlights: ["EON IT Park proximity", "Airport 15 min drive", "New BRTS corridor"],
    avgPricePerSqft: "₹8,500",
    yoyGrowth: "+14%",
  },
  {
    name: "Powai",
    city: "Mumbai",
    tag1: "Premium",
    tag2: "Lake View",
    overallScore: 91,
    description: "Powai is the crown jewel of suburban Mumbai — a planned township with lakeside living, top-tier institutions, and a thriving startup ecosystem.",
    scores: { Walkability: 9, Transit: 8, Schools: 10, Safety: 9 },
    highlights: ["IIT Mumbai & NITIE", "Hiranandani township", "Powai Lake frontage"],
    avgPricePerSqft: "₹22,000",
    yoyGrowth: "+9%",
  },
  {
    name: "Whitefield",
    city: "Bangalore",
    tag1: "IT Hub",
    tag2: "Metro Line",
    overallScore: 85,
    description: "Whitefield is Bangalore's premier IT suburb with international schools, high-street retail, and a growing metro network connecting it to the city.",
    scores: { Walkability: 7, Transit: 9, Schools: 9, Safety: 8 },
    highlights: ["Purple metro line", "EPIP Zone tech park", "International school belt"],
    avgPricePerSqft: "₹11,500",
    yoyGrowth: "+12%",
  },
  {
    name: "Gachibowli",
    city: "Hyderabad",
    tag1: "Emerging",
    tag2: "Tech Park",
    overallScore: 87,
    description: "Gachibowli is Hyderabad's IT nucleus with some of India's lowest property prices in a major metro, offering exceptional value and yield.",
    scores: { Walkability: 6, Transit: 8, Schools: 8, Safety: 9 },
    highlights: ["Lowest stamp duty in major metros", "Outer Ring Road access", "Financial District proximity"],
    avgPricePerSqft: "₹8,800",
    yoyGrowth: "+16%",
  },
  {
    name: "Dwarka Exp.",
    city: "Delhi NCR",
    tag1: "Affordable",
    tag2: "NH8 Access",
    overallScore: 79,
    description: "Dwarka Expressway has transformed from a long-awaited corridor to one of NCR's most active residential markets, now fully operational with rapid appreciation.",
    scores: { Walkability: 6, Transit: 7, Schools: 7, Safety: 7 },
    highlights: ["NH-48 superhighway", "IGI Airport 20 min", "Golf-course communities"],
    avgPricePerSqft: "₹10,200",
    yoyGrowth: "+18%",
  },
];

const SCORE_COLORS: Record<string, string> = {
  Walkability: "#10B981",
  Transit:     "#3B82F6",
  Schools:     "#8B5CF6",
  Safety:      "#F59E0B",
};

const SCORE_ICONS: Record<string, string> = {
  Walkability: "🚶",
  Transit:     "🚇",
  Schools:     "🏫",
  Safety:      "🛡️",
};

const BG_COLORS = [
  "bg-amber-50", "bg-stone-100", "bg-orange-50",
  "bg-yellow-50", "bg-stone-50", "bg-amber-100",
];

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = SCORE_COLORS[label] ?? "#B45309";
  const pct = (value / 10) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-stone-600 flex items-center gap-1">
          <span>{SCORE_ICONS[label]}</span> {label}
        </span>
        <span className="text-xs font-bold" style={{ color }}>{value}/10</span>
      </div>
      <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function AreaCard({ area, index }: { area: AreaData; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const scoreEntries = Object.entries(area.scores) as [string, number][];

  return (
    <div
      className={cn(
        BG_COLORS[index],
        "rounded-2xl border border-stone-200 transition-all duration-300",
        expanded ? "border-amber-300 shadow-md" : "hover:border-amber-300 hover:shadow-md"
      )}
    >
      {/* Card top */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <MapPin size={18} className="text-amber-700" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-900">{area.name}</h3>
              <p className="text-sm text-stone-500">{area.city}</p>
            </div>
          </div>
          {/* Overall score ring */}
          <div className="flex-shrink-0 text-center">
            <div className="w-12 h-12 rounded-full bg-white border-2 border-amber-300 flex items-center justify-center shadow-sm">
              <span className="text-base font-black text-amber-800">{area.overallScore}</span>
            </div>
            <p className="text-[9px] text-stone-400 mt-0.5 font-medium">/ 100</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">{area.tag1}</span>
          <span className="px-2.5 py-1 rounded-full bg-white text-stone-600 text-xs font-medium border border-stone-200">{area.tag2}</span>
        </div>

        {/* Score bars */}
        <div className="space-y-2.5">
          {scoreEntries.map(([label, value]) => (
            <ScoreBar key={label} label={label} value={value} />
          ))}
        </div>

        {/* Quick metrics */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-stone-200/60">
          <div className="flex-1 bg-white/70 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-stone-400 font-medium">Avg/sqft</p>
            <p className="text-sm font-bold text-stone-800">{area.avgPricePerSqft}</p>
          </div>
          <div className="flex-1 bg-white/70 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-stone-400 font-medium">YoY Growth</p>
            <p className="text-sm font-bold text-emerald-600">{area.yoyGrowth}</p>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
        >
          {expanded ? <><ChevronUp size={13} /> Hide Details</> : <><ChevronDown size={13} /> Radar & Insights</>}
        </button>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-stone-200/60 bg-white/50 p-5">
          <div className="flex flex-col sm:flex-row gap-5 items-center">
            {/* Spider chart */}
            <div className="flex-shrink-0">
              <SpiderChart scores={area.scores} size={170} />
            </div>

            {/* Right: description + highlights */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-600 leading-relaxed mb-4">{area.description}</p>

              <div className="space-y-2">
                <p className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase">Key Highlights</p>
                {area.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-stone-700">
                    <span className="text-amber-600 mt-0.5 flex-shrink-0">✦</span>
                    {h}
                  </div>
                ))}
              </div>

              <Link
                href={`/map?city=${area.city}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900"
              >
                Browse {area.name} properties <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NeighbourhoodsPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-14 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest text-amber-700 uppercase mb-3">Hyper-Local Insights</p>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4">
            Explore <span className="text-gradient">Neighbourhoods</span>
          </h1>
          <p className="text-stone-500 max-w-2xl mx-auto">
            Qualitative scores for Walkability, Transit, Schools & Safety — visualised with progress bars and spider charts. Click any card to expand.
          </p>
        </div>

        {/* Score legend */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {Object.entries(SCORE_COLORS).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-stone-200 text-xs font-medium text-stone-600 shadow-sm">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {SCORE_ICONS[label]} {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {AREAS.map((area, i) => (
            <AreaCard key={i} area={area} index={i} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/trends"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors"
          >
            View Market Trends <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
