"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, Bell, Heart, LogOut, Search, Loader2, Sparkles, Map, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/concierge", label: "Concierge" },
  { href: "/map", label: "Map Search" },
  { href: "/compare-areas", label: "Invest" },
  { href: "/avm", label: "Valuation" },
  { href: "/rera", label: "RERA" },
  { href: "/premium", label: "Premium" },
];

interface AuthUser {
  name: string;
  email: string;
}

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data || null);
        setAuthLoaded(true);
      })
      .catch(() => setAuthLoaded(true));
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearchLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      const filters = data.filters || {};

      // Build URL params from AI-extracted filters
      const params = new URLSearchParams();
      if (filters.city) params.set("city", filters.city);
      if (filters.bedrooms) params.set("bedrooms", String(filters.bedrooms));
      if (filters.budget) params.set("budget", String(filters.budget));
      if (filters.type) params.set("type", filters.type);
      if (filters.purpose) params.set("purpose", filters.purpose);
      if (filters.areaKeyword) params.set("areaKeyword", filters.areaKeyword);
      // Always include original query for display
      params.set("q", query);

      setSearchOpen(false);
      setSearchQuery("");
      router.push(`/map?${params.toString()}`);
    } catch {
      // Fallback: plain keyword search
      setSearchOpen(false);
      setSearchQuery("");
      router.push(`/map?q=${encodeURIComponent(query)}`);
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Search bar (expands below logo row) */}
          {searchOpen && (
            <form onSubmit={handleSearch} className="py-2.5 space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={searchLoading}
                    placeholder="Try: 3BHK near good schools in Pune under ₹1.5Cr…"
                    className="w-full pl-4 pr-10 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all disabled:opacity-60"
                  />
                  {searchQuery.trim() && !searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                      <Sparkles size={12} className="text-amber-500" />
                      <span className="text-[10px] text-amber-600 font-medium">AI</span>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!searchQuery.trim() || searchLoading}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 min-w-[80px] justify-center",
                    searchQuery.trim() && !searchLoading
                      ? "bg-amber-700 text-white hover:bg-amber-800"
                      : "bg-stone-100 text-stone-400 cursor-not-allowed"
                  )}
                >
                  {searchLoading ? <Loader2 size={14} className="animate-spin" /> : "Search"}
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchLoading(false); }}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              {searchLoading && (
                <div className="flex items-center gap-2 px-1">
                  <Sparkles size={12} className="text-amber-500 animate-pulse" />
                  <span className="text-xs text-amber-600 font-medium">AI is understanding your query…</span>
                </div>
              )}
            </form>
          )}

          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-0.5 shrink-0">
              <span className="text-xl font-bold text-stone-900 tracking-tight">Grey</span>
              <span className="text-xl font-bold text-amber-700 tracking-tight"> Advisor</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3.5 py-2 text-sm font-medium rounded-lg transition-colors relative",
                      isActive
                        ? "text-amber-700"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-amber-700" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Side */}
            <div className="hidden md:flex items-center gap-1">
              {/* Search icon */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  searchOpen
                    ? "bg-amber-50 text-amber-700"
                    : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                )}
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {/* Map Search icon button */}
              <Link
                href="/map"
                className={cn(
                  "flex items-center gap-1.5 text-sm text-stone-500 hover:text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors",
                  pathname === "/map" ? "text-amber-700 bg-amber-50" : ""
                )}
                title="Map Search"
              >
                <Map size={16} />
                <span className="hidden lg:inline">Map</span>
              </Link>

              <button className="p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors">
                <Bell size={18} />
              </button>

              <Link href="/wishlist" className="p-2 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition-colors">
                <Heart size={18} />
              </Link>

              {/* Auth State */}
              {!authLoaded ? (
                <div className="w-20 h-9 rounded-full bg-stone-100 animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-bold">
                      {user.name[0].toUpperCase()}
                    </div>
                    {user.name.split(" ")[0]}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Sign out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="px-5 py-2 rounded-full bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors shadow-sm shadow-amber-900/10"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile: search icon only — drawer handled by MobileNav */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
