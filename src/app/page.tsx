"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot, MapPin, TrendingUp, Calculator, Shield, Sparkles,
  ArrowRight, Building2, Search, ChevronRight,
  Star, BarChart3, Zap, Home, CheckCircle2, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Stats ────────────────────────────────────────────────────────────────────
const STATS = [
  { value: "4,200+", label: "Verified Listings" },
  { value: "5", label: "Metro Cities" },
  { value: "98%", label: "RERA Compliant" },
  { value: "₹0", label: "Advisory Fee" },
];

// ─── Cities ───────────────────────────────────────────────────────────────────
const CITIES = [
  { name: "Mumbai", emoji: "🏙️", desc: "Financial capital" },
  { name: "Pune", emoji: "🌆", desc: "IT hub" },
  { name: "Bangalore", emoji: "🌳", desc: "Silicon Valley" },
  { name: "Hyderabad", emoji: "💎", desc: "Rapid growth" },
  { name: "Delhi NCR", emoji: "🏛️", desc: "Capital region" },
];

// ─── Quick Prompts ─────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "3BHK in Baner Pune under ₹90L",
  "Best areas for NRI investment in Bangalore",
  "Compare Powai vs Thane rental yield",
  "Luxury villa in Hyderabad ₹3Cr RERA",
];

// ─── Recent Property Seeds (shown in the featured strip) ──────────────────────
const FEATURED_SEEDS = [
  { name: "Lodha Amara", area: "Thane West", city: "Mumbai", price: "1.2 Cr", type: "3 BHK", tag: "RERA ✓" },
  { name: "VTP Purvanchal", area: "Baner", city: "Pune", price: "88 L", type: "2 BHK", tag: "Hot Deal" },
  { name: "Embassy Springs", area: "Devanahalli", city: "Bangalore", price: "2.4 Cr", type: "4 BHK", tag: "Luxury" },
  { name: "Phoenix Greenville", area: "Kondapur", city: "Hyderabad", price: "65 L", type: "2 BHK", tag: "New Launch" },
];

// ─── Animated Number ──────────────────────────────────────────────────────────
function AnimatedStat({ value, label }: { value: string; label: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("transition-all duration-700", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
      <p className="text-2xl sm:text-3xl font-bold text-stone-900">{value}</p>
      <p className="text-xs text-stone-500 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Featured Property Card ───────────────────────────────────────────────────
function FeaturedCard({ item, index }: { item: typeof FEATURED_SEEDS[0]; index: number }) {
  const imgs = [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80",
  ];
  const tagColor = item.tag === "Hot Deal"
    ? "bg-red-500 text-white"
    : item.tag === "Luxury"
    ? "bg-amber-700 text-white"
    : item.tag === "New Launch"
    ? "bg-emerald-600 text-white"
    : "bg-emerald-600 text-white";

  return (
    <Link
      href={`/map?city=${item.city.split(" ")[0]}`}
      className="flex-shrink-0 w-52 bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 transition-all group"
    >
      <div className="relative h-28 overflow-hidden">
        <img src={imgs[index % imgs.length]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <span className={cn("absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full", tagColor)}>{item.tag}</span>
        <span className="absolute top-2 right-2 bg-white/95 text-stone-900 font-bold text-[11px] px-2 py-0.5 rounded-full">₹{item.price}</span>
      </div>
      <div className="p-3">
        <p className="text-xs font-bold text-stone-900 line-clamp-1">{item.name}</p>
        <p className="text-[10px] text-stone-500 flex items-center gap-0.5 mt-0.5"><MapPin size={8} />{item.area}, {item.city}</p>
        <span className="mt-1.5 inline-block bg-stone-50 border border-stone-100 text-stone-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full">{item.type}</span>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCity, setActiveCity] = useState("Mumbai");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    // Route directly to AI concierge — the ?q= param auto-fires the first message
    router.push(`/concierge?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">

      {/* ── HERO SECTION ─────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-12 px-4 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-amber-50/80 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={12} className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-800">India&apos;s #1 AI Real Estate Advisor</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight tracking-tight mb-5">
            Find your perfect{" "}
            <span className="text-gradient">property</span>
            <br />with AI intelligence
          </h1>
          <p className="text-stone-500 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            RERA-verified listings · Real-time market insights · Expert AI concierge · Zero advisory fee
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
            <div className="flex gap-2 bg-white rounded-2xl border border-stone-200 shadow-md p-2 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-100 transition-all">
              <div className="flex-1 flex items-center gap-2 px-2">
                <Search size={16} className="text-stone-400 flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. 3BHK in Baner Pune under ₹90L, RERA verified…"
                  className="flex-1 text-sm text-stone-800 placeholder:text-stone-400 bg-transparent focus:outline-none py-2"
                />
                {query && (
                  <div className="flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-500" />
                    <span className="text-[10px] text-amber-600 font-medium">AI</span>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={!query.trim()}
                className={cn(
                  "flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  query.trim()
                    ? "bg-amber-700 text-white hover:bg-amber-800 shadow-sm"
                    : "bg-stone-100 text-stone-400 cursor-not-allowed"
                )}
              >
                <Bot size={14} /> Ask Grey AI
              </button>
            </div>
          </form>

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-2 justify-center">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => router.push(`/concierge?q=${encodeURIComponent(p)}`)}
                className="text-xs text-stone-600 bg-white border border-stone-200 hover:border-amber-300 hover:text-amber-800 hover:bg-amber-50 px-3 py-1.5 rounded-full transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────────────── */}
      <section className="border-y border-stone-100 bg-white/60 backdrop-blur-sm py-7 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => <AnimatedStat key={s.label} {...s} />)}
        </div>
      </section>

      {/* ── BENTO GRID ────────────────────────────────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest text-amber-700 uppercase mb-2">Everything you need</p>
            <h2 className="text-3xl font-bold text-stone-900">One platform. Complete advisory.</h2>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">

            {/* Card 1: AI Concierge — Full width on mobile, 2/3 on desktop */}
            <Link
              href="/concierge"
              className="sm:col-span-2 group relative bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-7 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-700/10 rounded-full blur-2xl" />

              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-amber-700 flex items-center justify-center mb-5">
                  <Bot size={24} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">AI Concierge</h3>
                <p className="text-stone-400 text-sm leading-relaxed mb-5 max-w-sm">
                  Chat with Grey AI — get RERA-verified recommendations, investment analysis, EMI calculations, and book site visits in one conversation.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["RERA verified", "Investment analysis", "WhatsApp booking", "Multi-city"].map((tag) => (
                    <span key={tag} className="text-[11px] bg-white/10 text-stone-300 px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm group-hover:gap-3 transition-all">
                  Talk to Grey <ArrowRight size={16} />
                </div>
              </div>
            </Link>

            {/* Card 2: Map Search */}
            <Link
              href="/map"
              className="group relative bg-white rounded-3xl border border-stone-100 shadow-sm p-6 overflow-hidden hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <MapPin size={20} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-1.5">Map Search</h3>
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">Draw a boundary on the map and discover every verified property within it. Pin-level precision.</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 group-hover:text-blue-600 transition-colors">
                Open Map <ChevronRight size={15} />
              </div>
              {/* Mini map visual */}
              <div className="absolute bottom-0 right-0 w-28 h-20 opacity-20 group-hover:opacity-30 transition-opacity">
                <div className="w-full h-full bg-gradient-to-tl from-blue-200 to-transparent rounded-tl-3xl" />
              </div>
            </Link>

            {/* Card 3: AVM Valuation */}
            <Link
              href="/avm"
              className="group bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                <BarChart3 size={20} className="text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-1.5">Property Valuation</h3>
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">Get an instant AI-powered market valuation with confidence scores, rental yield, and bull/bear analysis.</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 group-hover:gap-2.5 transition-all">
                Value My Property <ChevronRight size={15} />
              </div>
            </Link>

            {/* Card 4: EMI Calculator */}
            <Link
              href="/emi-calculator"
              className="group bg-white rounded-3xl border border-stone-100 shadow-sm p-6 hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                <Calculator size={20} className="text-emerald-700" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-1.5">EMI Calculator</h3>
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">Instant home loan EMI with principal vs interest breakdown. Preset loan amounts for quick planning.</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 group-hover:gap-2.5 transition-all">
                Calculate EMI <ChevronRight size={15} />
              </div>
            </Link>

            {/* Card 5: Market Trends */}
            <Link
              href="/trends"
              className="group bg-white rounded-3xl border border-stone-100 shadow-sm p-6 hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
                <TrendingUp size={20} className="text-violet-600" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-1.5">Market Trends</h3>
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">Live price trends, YoY appreciation, rental yield data across Mumbai, Pune, Bangalore, and more.</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-violet-700 group-hover:gap-2.5 transition-all">
                View Trends <ChevronRight size={15} />
              </div>
            </Link>

            {/* Card 6: RERA Check — Full width */}
            <Link
              href="/rera"
              className="sm:col-span-2 lg:col-span-1 group bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <Shield size={20} className="text-emerald-700" />
                </div>
                <div className="flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={10} /> CERTIFIED
                </div>
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-1.5">RERA Verification</h3>
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">Check if any project is RERA-registered. Validate builder compliance before you invest.</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800 group-hover:gap-2.5 transition-all">
                Verify Project <ChevronRight size={15} />
              </div>
            </Link>

            {/* Card 7: Compare Areas */}
            <Link
              href="/compare-areas"
              className="group bg-white rounded-3xl border border-stone-100 shadow-sm p-6 hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center mb-4 group-hover:bg-rose-100 transition-colors">
                <Building2 size={20} className="text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-1.5">Area Comparison</h3>
              <p className="text-sm text-stone-500 mb-4 leading-relaxed">Compare any two micro-markets on price/sqft, appreciation, yield, infra, connectivity & more.</p>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-rose-700 group-hover:gap-2.5 transition-all">
                Compare Areas <ChevronRight size={15} />
              </div>
            </Link>

            {/* Card 8: Premium */}
            <Link
              href="/premium"
              className="group relative bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900/50 rounded-3xl p-6 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                    <Star size={20} className="text-amber-400" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">Premium</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1.5">Go Premium</h3>
                <p className="text-sm text-stone-400 mb-4 leading-relaxed">Unlock unlimited AI queries, priority support, off-market deals, and dedicated advisor calls.</p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-400 group-hover:gap-2.5 transition-all">
                  Explore Plans <ChevronRight size={15} />
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ── CITY QUICK-ACCESS ─────────────────────────────────────────────────── */}
      <section className="py-10 px-4 bg-white/50 border-y border-stone-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-900">Browse by City</h2>
            <Link href="/map" className="text-sm text-amber-700 font-semibold hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {CITIES.map((city) => (
              <button
                key={city.name}
                onClick={() => {
                  setActiveCity(city.name);
                  router.push(`/map?city=${encodeURIComponent(city.name)}`);
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md",
                  activeCity === city.name
                    ? "bg-amber-700 border-amber-700 text-white shadow-md"
                    : "bg-white border-stone-100 hover:border-amber-200 hover:bg-amber-50"
                )}
              >
                <span className="text-2xl">{city.emoji}</span>
                <div className="text-center">
                  <p className={cn("text-sm font-bold", activeCity === city.name ? "text-white" : "text-stone-900")}>{city.name}</p>
                  <p className={cn("text-[10px]", activeCity === city.name ? "text-amber-200" : "text-stone-400")}>{city.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROPERTIES STRIP ─────────────────────────────────────────── */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900">Featured Properties</h2>
              <p className="text-sm text-stone-500 mt-0.5">Handpicked, RERA-verified listings this week</p>
            </div>
            <Link href="/map" className="hidden sm:flex items-center gap-1 text-sm text-amber-700 font-semibold hover:underline">
              Browse All <ChevronRight size={14} />
            </Link>
          </div>
          {/* Horizontal scroll strip */}
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
            {FEATURED_SEEDS.map((item, i) => (
              <FeaturedCard key={item.name} item={item} index={i} />
            ))}
            {/* CTA card */}
            <Link
              href="/map"
              className="flex-shrink-0 w-52 bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col items-center justify-center p-6 text-center gap-3 snap-start"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Home size={20} className="text-white" />
              </div>
              <p className="text-sm font-bold text-white">View all 4,200+ listings</p>
              <div className="flex items-center gap-1 text-amber-200 text-xs font-medium">
                Browse Map <ArrowRight size={12} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY GREY ADVISOR ──────────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-stone-50 border-t border-stone-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-stone-900 mb-2">Why 12,000+ buyers trust Grey</h2>
            <p className="text-stone-500">Combining AI precision with real estate expertise</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap size={20} className="text-amber-700" />,
                bg: "bg-amber-50",
                title: "Instant AI Analysis",
                desc: "Get property valuations, investment ROI, EMI calculations, and area comparison in seconds — not days.",
              },
              {
                icon: <Shield size={20} className="text-emerald-700" />,
                bg: "bg-emerald-50",
                title: "100% RERA Compliant",
                desc: "Every recommendation is cross-checked for RERA registration. We never show non-compliant projects.",
              },
              {
                icon: <Users size={20} className="text-blue-700" />,
                bg: "bg-blue-50",
                title: "Zero Advisory Fee",
                desc: "Grey Advisor is completely free. Our AI concierge, valuation tools, and market data — no hidden charges.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 hover:shadow-md transition-all">
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4", item.bg)}>{item.icon}</div>
                <h3 className="font-bold text-stone-900 mb-2">{item.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 text-center bg-gradient-to-b from-white to-amber-50/30">
        <h2 className="text-3xl font-bold text-stone-900 mb-3">Ready to find your dream property?</h2>
        <p className="text-stone-500 mb-8">Talk to Grey AI — your personal real estate advisor, available 24/7.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/concierge"
            className="flex items-center gap-2 px-7 py-3 rounded-full bg-amber-700 text-white font-semibold hover:bg-amber-800 transition-all shadow-md shadow-amber-900/15 hover:shadow-lg hover:shadow-amber-900/20 hover:-translate-y-0.5"
          >
            <Bot size={18} /> Talk to Grey AI
          </Link>
          <Link
            href="/map"
            className="flex items-center gap-2 px-7 py-3 rounded-full border-2 border-stone-200 text-stone-700 font-semibold hover:border-amber-400 hover:text-amber-800 hover:bg-amber-50 transition-all"
          >
            <MapPin size={18} /> Browse Map
          </Link>
        </div>
      </section>

    </div>
  );
}
