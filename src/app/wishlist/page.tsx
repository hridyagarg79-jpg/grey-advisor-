"use client";

import { useEffect, useState } from "react";
import { Heart, ExternalLink, Trash2, MapPin, Building2, TrendingUp, Bot } from "lucide-react";
import Link from "next/link";

interface WishlistItem {
  id: string;
  property_id: string;
  property_name?: string;
  area?: string;
  city?: string;
  price?: number;
  photo_url?: string;
  added_at: string;
}

function WishlistCard({
  item,
  onRemove,
  removing,
}: {
  item: WishlistItem;
  onRemove: (propertyId: string) => void;
  removing: boolean;
}) {
  return (
    <div className="group bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:border-amber-200 hover:shadow-md transition-all flex flex-col">
      {/* Image */}
      {item.photo_url ? (
        <div className="h-40 overflow-hidden">
          <img
            src={item.photo_url}
            alt={item.property_name || "Property"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-stone-100 to-amber-50 flex items-center justify-center">
          <Building2 size={36} className="text-stone-300" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-stone-900 text-sm leading-tight line-clamp-2">
            {item.property_name || "Saved Property"}
          </h3>
          {item.price && (
            <span className="flex-shrink-0 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
              ₹{(item.price / 1e7).toFixed(1)}Cr
            </span>
          )}
        </div>

        {(item.area || item.city) && (
          <p className="flex items-center gap-1 text-xs text-stone-400 mb-1">
            <MapPin size={10} />
            {[item.area, item.city].filter(Boolean).join(", ")}
          </p>
        )}

        <p className="text-[10px] text-stone-300 mb-3">
          Saved {new Date(item.added_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-stone-50">
          <button
            onClick={() => onRemove(item.property_id)}
            disabled={removing}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-40 transition-colors"
          >
            <Trash2 size={11} />
            {removing ? "Removing…" : "Remove"}
          </button>
          <Link
            href={`/property/${item.property_id}`}
            className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-medium"
          >
            View <ExternalLink size={10} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/wishlist");
        if (res.status === 401) {
          setNotLoggedIn(true);
          setLoading(false);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        /* handled */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleRemove(propertyId: string) {
    setRemoving(propertyId);
    try {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      setItems((prev) => prev.filter((p) => p.property_id !== propertyId));
      // Also clear localStorage flag
      localStorage.removeItem(`wl_${propertyId}`);
    } catch (e) {
      console.error(e);
    } finally {
      setRemoving(null);
    }
  }

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (notLoggedIn) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <Heart className="text-amber-600" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Sign in to see your wishlist</h1>
        <p className="text-stone-500 text-sm mb-6">Your saved properties are stored to your account.</p>
        <Link
          href="/auth/signin?redirect=/wishlist"
          className="px-6 py-2.5 rounded-full bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="h-9 w-48 bg-stone-100 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-72 bg-stone-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden animate-pulse">
              <div className="h-40 bg-stone-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-stone-100 rounded w-3/4" />
                <div className="h-3 bg-stone-50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-2 flex items-center gap-3">
            <Heart className="text-red-400 fill-red-100" size={30} />
            My Wishlist
          </h1>
          <p className="text-stone-500">Properties you've saved for later.</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <Heart className="text-red-300" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-stone-800 mb-2">Nothing saved yet</h3>
          <p className="text-sm text-stone-500 max-w-sm mb-6 leading-relaxed">
            Ask Grey AI for property recommendations, then tap the{" "}
            <span className="inline-flex items-center gap-1 text-red-400 font-semibold">
              <Heart size={12} className="fill-red-400" /> heart
            </span>{" "}
            on any card to save it here.
          </p>
          <div className="flex gap-3">
            <Link
              href="/concierge"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors"
            >
              <Bot size={14} /> Ask Grey AI
            </Link>
            <Link
              href="/map"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-50 transition-colors"
            >
              Browse Map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main wishlist ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-1 flex items-center gap-3">
            <Heart className="text-red-400 fill-red-100" size={30} />
            My Wishlist
          </h1>
          <p className="text-stone-500 text-sm">{items.length} saved {items.length === 1 ? "property" : "properties"}</p>
        </div>
        <Link
          href="/concierge"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors"
        >
          <TrendingUp size={14} /> Find More
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => (
          <WishlistCard
            key={item.id}
            item={item}
            onRemove={handleRemove}
            removing={removing === item.property_id}
          />
        ))}
      </div>
    </div>
  );
}
