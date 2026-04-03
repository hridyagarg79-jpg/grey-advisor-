"use client";
// v5 — Premium bottom tab bar + slide-up drawer for all features

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, MapPin, Bot, Heart, LayoutGrid,
  X, Search, Loader2, Sparkles,
  TrendingUp, ShieldCheck, Star, BarChart3,
  LogOut, User, ChevronRight, Bell,
  Building2, Map,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Bottom tabs (always visible) ─────────────────────────────────────────────
const BOTTOM_TABS = [
  { href: "/",          label: "Home",      icon: Home    },
  { href: "/map",       label: "Map",       icon: Map     },
  { href: "/concierge", label: "Grey AI",   icon: Bot     },
  { href: "/wishlist",  label: "Saved",     icon: Heart   },
  { href: "#more",      label: "More",      icon: LayoutGrid },
];

// ─── Drawer sections ───────────────────────────────────────────────────────────
const DRAWER_FEATURES = [
  { href: "/concierge",    label: "AI Concierge",   icon: Bot,        color: "amber",  desc: "Chat with Grey AI" },
  { href: "/map",          label: "Map Search",     icon: Map,        color: "blue",   desc: "Explore properties" },
  { href: "/compare-areas",label: "Invest",         icon: TrendingUp, color: "emerald",desc: "Compare markets" },
  { href: "/avm",          label: "Valuation",      icon: BarChart3,  color: "purple", desc: "AI price estimate" },
  { href: "/rera",         label: "RERA Check",     icon: ShieldCheck,color: "teal",   desc: "Verify projects" },
  { href: "/premium",      label: "Premium",        icon: Star,       color: "rose",   desc: "Unlock all features" },
  { href: "/wishlist",     label: "Saved",          icon: Heart,      color: "pink",   desc: "Your shortlist" },
  { href: "/neighbourhoods",label: "Neighbourhoods",icon: Building2,  color: "indigo", desc: "Area deep dives" },
];

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  amber:   { bg: "bg-amber-100",   text: "text-amber-700",   ring: "ring-amber-200"  },
  blue:    { bg: "bg-blue-100",    text: "text-blue-700",    ring: "ring-blue-200"   },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200"},
  purple:  { bg: "bg-purple-100",  text: "text-purple-700",  ring: "ring-purple-200" },
  teal:    { bg: "bg-teal-100",    text: "text-teal-700",    ring: "ring-teal-200"   },
  rose:    { bg: "bg-rose-100",    text: "text-rose-700",    ring: "ring-rose-200"   },
  pink:    { bg: "bg-pink-100",    text: "text-pink-700",    ring: "ring-pink-200"   },
  indigo:  { bg: "bg-indigo-100",  text: "text-indigo-700",  ring: "ring-indigo-200" },
};

interface AuthUser { name: string; email: string; }

export default function MobileNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [user, setUser]                 = useState<AuthUser | null>(null);
  const [authLoaded, setAuthLoaded]     = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setUser(d || null); setAuthLoaded(true); })
      .catch(() => setAuthLoaded(true));
  }, [pathname]);

  // ── Close drawer on route change ──────────────────────────────────────────
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // ── Lock body scroll when drawer open ────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // ── Search focus ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
    setDrawerOpen(false);
    window.location.href = "/";
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    try {
      const res  = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      const f    = data.filters || {};
      const p    = new URLSearchParams();
      if (f.city)        p.set("city",        f.city);
      if (f.bedrooms)    p.set("bedrooms",    String(f.bedrooms));
      if (f.budget)      p.set("budget",      String(f.budget));
      if (f.type)        p.set("type",        f.type);
      if (f.areaKeyword) p.set("areaKeyword", f.areaKeyword);
      p.set("q", q);
      setDrawerOpen(false);
      setSearchOpen(false);
      setSearchQuery("");
      router.push(`/map?${p.toString()}`);
    } catch {
      setDrawerOpen(false);
      router.push(`/map?q=${encodeURIComponent(q)}`);
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <>
      {/* ── Fixed Bottom Tab Bar ──────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        {/* Frosted glass bar */}
        <div className="bg-white/95 backdrop-blur-xl border-t border-stone-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-5 h-[60px] px-1">
            {BOTTOM_TABS.map(({ href, label, icon: Icon }) => {
              const isMore   = href === "#more";
              const isActive = isMore
                ? drawerOpen
                : href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);

              return (
                <button
                  key={href}
                  onClick={() => {
                    if (isMore) {
                      setDrawerOpen((o) => !o);
                    } else {
                      setDrawerOpen(false);
                      router.push(href);
                    }
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-[3px] transition-all duration-200",
                    isActive ? "text-amber-700" : "text-stone-400"
                  )}
                >
                  {/* Active pill background */}
                  {isActive && !isMore && (
                    <span className="absolute inset-x-2 top-1 bottom-1 rounded-2xl bg-amber-50 -z-10" />
                  )}

                  {/* Concierge bubble */}
                  {href === "/concierge" ? (
                    <span className={cn(
                      "w-9 h-9 rounded-2xl flex items-center justify-center transition-all",
                      isActive
                        ? "bg-amber-700 text-white shadow-lg shadow-amber-700/30"
                        : "bg-stone-100 text-stone-500"
                    )}>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </span>
                  ) : isMore ? (
                    <span className={cn(
                      "w-9 h-9 rounded-2xl flex items-center justify-center transition-all",
                      isActive
                        ? "bg-stone-800 text-white"
                        : "bg-stone-100 text-stone-500"
                    )}>
                      <Icon size={18} strokeWidth={2} />
                    </span>
                  ) : (
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  )}

                  <span className={cn(
                    "text-[10px] font-semibold leading-none tracking-tight",
                    isActive ? "text-amber-700" : "text-stone-400"
                  )}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* iPhone safe-area spacer */}
          <div className="h-safe-bottom bg-transparent" style={{ height: "env(safe-area-inset-bottom)" }} />
        </div>
      </nav>

      {/* ── Slide-up Drawer Backdrop ──────────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-all duration-300",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        onClick={() => setDrawerOpen(false)}
        style={{ background: drawerOpen ? "rgba(12,10,9,0.5)" : "transparent" }}
      />

      {/* ── Slide-up Drawer Panel ─────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed left-0 right-0 bottom-0 z-50 md:hidden",
          "bg-white rounded-t-[28px] shadow-2xl",
          "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "max-h-[90dvh] flex flex-col",
          drawerOpen ? "translate-y-0" : "translate-y-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain flex-1 px-5 pb-8">

          {/* ── Header row ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between py-3 mb-1">
            <div>
              <span className="text-lg font-bold text-stone-900 tracking-tight">Grey</span>
              <span className="text-lg font-bold text-amber-700 tracking-tight"> Advisor</span>
              <p className="text-[11px] text-stone-400 mt-0.5">Pan-India AI Real Estate</p>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:bg-stone-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── User profile card ───────────────────────────────────────── */}
          {authLoaded && (
            <div className="mb-4">
              {user ? (
                <div className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 text-sm flex items-center justify-center font-bold shrink-0">
                    {user.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-stone-800 truncate">{user.name}</p>
                    <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <Link
                      href="/profile"
                      className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-amber-700 transition-colors"
                    >
                      <User size={14} />
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <LogOut size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="flex items-center justify-between w-full bg-amber-700 text-white rounded-2xl px-4 py-3.5 shadow-lg shadow-amber-700/20"
                >
                  <div>
                    <p className="text-[13px] font-bold">Sign in to Grey Advisor</p>
                    <p className="text-[11px] text-amber-200 mt-0.5">Access AI concierge & saved properties</p>
                  </div>
                  <ChevronRight size={18} className="text-amber-300 shrink-0" />
                </Link>
              )}
            </div>
          )}

          {/* ── AI Search bar ───────────────────────────────────────────── */}
          <div className="mb-5">
            {!searchOpen ? (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-stone-400 text-[13px] hover:border-amber-300 transition-colors"
              >
                <Search size={16} />
                <span className="flex-1 text-left">Search any property or location…</span>
                <span className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                  <Sparkles size={10} className="text-amber-500" />
                  <span className="text-[10px] text-amber-600 font-semibold">AI</span>
                </span>
              </button>
            ) : (
              <form onSubmit={handleSearch} className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={searchLoading}
                      placeholder="3BHK in Pune under ₹80L…"
                      className="w-full pl-4 pr-10 py-3 rounded-2xl border border-amber-300 bg-white text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all"
                    />
                    {searchQuery && !searchLoading && (
                      <Sparkles size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500" />
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!searchQuery.trim() || searchLoading}
                    className={cn(
                      "px-4 py-3 rounded-2xl text-sm font-bold transition-colors flex items-center gap-1.5",
                      searchQuery.trim() && !searchLoading
                        ? "bg-amber-700 text-white"
                        : "bg-stone-100 text-stone-400 cursor-not-allowed"
                    )}
                  >
                    {searchLoading ? <Loader2 size={16} className="animate-spin" /> : "Go"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    className="px-3 py-3 rounded-2xl text-stone-400 bg-stone-100 hover:bg-stone-200 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                {searchLoading && (
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className="text-amber-500 animate-pulse" />
                    <span className="text-xs text-amber-600 font-medium">AI is understanding your query…</span>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* ── Features grid ───────────────────────────────────────────── */}
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">Features</p>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {DRAWER_FEATURES.map(({ href, label, icon: Icon, color, desc }) => {
              const c       = COLOR_MAP[color];
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-2 py-3 px-1 rounded-2xl border transition-all active:scale-95",
                    isActive
                      ? `${c.bg} border-transparent ring-1 ${c.ring}`
                      : "bg-stone-50 border-stone-100 hover:border-stone-200"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", c.bg, c.text)}>
                    <Icon size={19} strokeWidth={1.8} />
                  </div>
                  <span className={cn("text-[10px] font-semibold text-center leading-tight", isActive ? c.text : "text-stone-600")}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* ── Bottom links row ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-1">
            <Link
              href="/profile"
              className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center">
                  <User size={15} className="text-stone-500" />
                </div>
                <span className="text-[13px] font-medium text-stone-700">My Profile</span>
              </div>
              <ChevronRight size={16} className="text-stone-300" />
            </Link>
            <Link
              href="/wishlist"
              className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Heart size={15} className="text-rose-500" />
                </div>
                <span className="text-[13px] font-medium text-stone-700">Saved Properties</span>
              </div>
              <ChevronRight size={16} className="text-stone-300" />
            </Link>
            <button className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-stone-50 transition-colors w-full">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center">
                  <Bell size={15} className="text-stone-500" />
                </div>
                <span className="text-[13px] font-medium text-stone-700">Notifications</span>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Soon</span>
            </button>
          </div>

          {/* ── Bottom branding ─────────────────────────────────────────── */}
          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
            <p className="text-[11px] text-stone-300">Grey Advisor © 2025</p>
            <div className="flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" />
              <p className="text-[11px] text-stone-400 font-medium">Powered by AI</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
