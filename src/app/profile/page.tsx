"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut, User, Heart, Settings, ShieldCheck, ExternalLink,
  Trash2, Phone, MapPin, Edit3, Check, X, Building2,
  TrendingUp, BookMarked, Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  avatar_url?: string;
  preferences?: Record<string, unknown>;
}

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

const INDIAN_CITIES = [
  "Mumbai", "Pune", "Bangalore", "Hyderabad", "Delhi NCR",
  "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Surat",
];

function Avatar({ user }: { user: UserProfile }) {
  if (user.avatar_url) {
    return (
      <Image
        src={user.avatar_url}
        alt={user.name}
        width={72}
        height={72}
        className="w-[72px] h-[72px] rounded-2xl object-cover ring-2 ring-white shadow-md"
      />
    );
  }
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";
  return (
    <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-white text-2xl font-bold shadow-md">
      {initials}
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string | number; color: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-3 ${color}`}>
      <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium opacity-70 leading-none mb-0.5">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"saved" | "settings">("saved");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // Fetch profile (new endpoint)
        const profileRes = await fetch("/api/profile");
        if (!profileRes.ok) {
          router.push("/auth/signin?redirect=/profile");
          return;
        }
        const profile = await profileRes.json();
        setUser(profile);
        setEditName(profile.name || "");
        setEditPhone(profile.phone || "");
        setEditCity(profile.city || "");

        // Fetch wishlist
        const wlRes = await fetch("/api/wishlist");
        if (wlRes.ok) {
          const wlData = await wlRes.json();
          setWishlist(Array.isArray(wlData) ? wlData : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function saveProfile() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone: editPhone, city: editCity }),
      });
      if (!res.ok) throw new Error("Save failed");
      const { profile } = await res.json();
      setUser(profile);
      setSaveMsg("Saved!");
      setEditing(false);
      setTimeout(() => setSaveMsg(""), 3000);
    } catch {
      setSaveMsg("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function removeFromWishlist(propertyId: string) {
    setRemoving(propertyId);
    try {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      setWishlist((prev) => prev.filter((p) => p.property_id !== propertyId));
    } catch (e) {
      console.error(e);
    } finally {
      setRemoving(null);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-amber-700 border-t-transparent animate-spin" />
          <p className="text-stone-400 text-sm">Loading your profile…</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Top hero strip ──────────────────────────────────────── */}
      <div className="relative mb-8 rounded-3xl overflow-hidden bg-gradient-to-r from-stone-900 via-stone-800 to-amber-900 p-6 sm:p-8">
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)", backgroundSize: "24px 24px" }} />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Avatar user={user} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">{user.name}</h1>
              <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                Member
              </span>
            </div>
            <p className="text-stone-300 text-sm mb-3">{user.email}</p>
            <div className="flex flex-wrap gap-3 text-xs">
              {user.phone && (
                <span className="flex items-center gap-1 text-stone-300">
                  <Phone size={11} /> {user.phone}
                </span>
              )}
              {user.city && (
                <span className="flex items-center gap-1 text-stone-300">
                  <MapPin size={11} /> {user.city}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-red-500/20 hover:border-red-400/30 transition-all"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>

        {/* Stats row */}
        <div className="relative grid grid-cols-3 gap-3 mt-6">
          <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-3 text-center">
            <p className="text-2xl font-bold text-white">{wishlist.length}</p>
            <p className="text-xs text-stone-300 mt-0.5">Saved</p>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-3 text-center">
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-xs text-stone-300 mt-0.5">Visits</p>
          </div>
          <div className="rounded-2xl bg-amber-500/20 backdrop-blur border border-amber-500/30 p-3 text-center">
            <p className="text-2xl font-bold text-amber-300">Free</p>
            <p className="text-xs text-amber-300/80 mt-0.5">Plan</p>
          </div>
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-4">

          {/* Nav tabs */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            {[
              { key: "saved", label: "Saved Properties", icon: <Heart size={15} />, count: wishlist.length },
              { key: "settings", label: "Account Settings", icon: <Settings size={15} />, count: null },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all border-b border-stone-50 last:border-0 ${
                  activeTab === tab.key
                    ? "bg-amber-50 text-amber-800"
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                <span className={activeTab === tab.key ? "text-amber-700" : "text-stone-400"}>
                  {tab.icon}
                </span>
                {tab.label}
                {tab.count !== null && (
                  <span className={`ml-auto text-xs font-bold rounded-full px-2 py-0.5 ${
                    activeTab === tab.key ? "bg-amber-200 text-amber-800" : "bg-stone-100 text-stone-500"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick stats */}
          <div className="space-y-3">
            <StatCard
              icon={<TrendingUp size={16} className="text-emerald-600" />}
              label="Avg Market Trend"
              value="+11% YoY"
              color="bg-emerald-50 border-emerald-100 text-emerald-900"
            />
            <StatCard
              icon={<Building2 size={16} className="text-blue-600" />}
              label="Properties Tracked"
              value={wishlist.length}
              color="bg-blue-50 border-blue-100 text-blue-900"
            />
            <StatCard
              icon={<BookMarked size={16} className="text-purple-600" />}
              label="AI Queries"
              value="Unlimited"
              color="bg-purple-50 border-purple-100 text-purple-900"
            />
          </div>

          {/* Upgrade card */}
          <div className="bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-amber-200" />
              <h3 className="font-bold text-white">Go Premium</h3>
            </div>
            <p className="text-xs text-amber-100/80 mb-4 leading-relaxed">
              5-year ROI projections, legal vetting, RERA deep-dives, and priority Concierge access.
            </p>
            <Link
              href="/premium"
              className="block w-full text-center py-2 rounded-full bg-white text-amber-800 text-sm font-semibold hover:bg-amber-50 transition-colors"
            >
              View Plans →
            </Link>
          </div>
        </div>

        {/* Right main panel */}
        <div className="lg:col-span-2">

          {/* ── SAVED PROPERTIES TAB ── */}
          {activeTab === "saved" && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-50">
                <div className="flex items-center gap-2">
                  <Heart className="text-red-400 fill-red-100" size={18} />
                  <h2 className="text-base font-bold text-stone-900">
                    Saved Properties{" "}
                    <span className="text-stone-400 font-normal">({wishlist.length})</span>
                  </h2>
                </div>
                {wishlist.length > 0 && (
                  <Link href="/map" className="text-xs text-amber-700 font-medium hover:text-amber-800">
                    Explore more →
                  </Link>
                )}
              </div>

              <div className="p-6">
                {wishlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                      <Heart className="text-red-300" size={24} />
                    </div>
                    <h3 className="text-base font-semibold text-stone-800 mb-2">Your wishlist is empty</h3>
                    <p className="text-sm text-stone-400 max-w-xs mb-6 leading-relaxed">
                      Ask the AI Concierge for property recommendations, then save the ones you love.
                    </p>
                    <Link
                      href="/concierge"
                      className="px-6 py-2.5 rounded-full bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors"
                    >
                      Talk to AI Concierge
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlist.map((item) => (
                      <div
                        key={item.id}
                        className="group relative rounded-xl border border-stone-100 overflow-hidden hover:border-amber-200 hover:shadow-md transition-all bg-white"
                      >
                        {/* Property image */}
                        {item.photo_url ? (
                          <div className="h-32 overflow-hidden">
                            <img
                              src={item.photo_url}
                              alt={item.property_name || "Property"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="h-32 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
                            <Building2 size={32} className="text-stone-300" />
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold text-stone-900 text-sm truncate pr-2 leading-tight">
                              {item.property_name || "Saved Property"}
                            </h4>
                            {item.price && (
                              <span className="text-amber-800 font-bold text-xs whitespace-nowrap bg-amber-50 px-2 py-0.5 rounded-lg">
                                ₹{(item.price / 1e7).toFixed(1)}Cr
                              </span>
                            )}
                          </div>
                          {(item.area || item.city) && (
                            <p className="text-xs text-stone-400 mb-3 flex items-center gap-1">
                              <MapPin size={10} />
                              {[item.area, item.city].filter(Boolean).join(", ")}
                            </p>
                          )}

                          <div className="flex justify-between items-center">
                            <button
                              onClick={() => removeFromWishlist(item.property_id)}
                              disabled={removing === item.property_id}
                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-40 transition-colors"
                            >
                              <Trash2 size={11} />
                              {removing === item.property_id ? "Removing…" : "Remove"}
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === "settings" && (
            <div className="space-y-5">
              {/* Profile info editor */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-50">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-stone-400" />
                    <h2 className="text-base font-bold text-stone-900">Personal Information</h2>
                  </div>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold hover:text-amber-800"
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditing(false); setSaveMsg(""); }}
                        className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700"
                      >
                        <X size={12} /> Cancel
                      </button>
                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="flex items-center gap-1 text-xs text-amber-700 font-semibold hover:text-amber-800 disabled:opacity-50"
                      >
                        <Check size={12} /> {saving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-5">
                  {saveMsg && (
                    <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
                      saveMsg.includes("Failed") ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
                    }`}>
                      {saveMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                        Full Name
                      </label>
                      {editing ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all"
                        />
                      ) : (
                        <p className="text-sm text-stone-800 font-medium">{user.name || "—"}</p>
                      )}
                    </div>

                    {/* Email (read-only) */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                        Email
                      </label>
                      <p className="text-sm text-stone-500">{user.email}</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Email cannot be changed</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                        Phone Number
                      </label>
                      {editing ? (
                        <input
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          type="tel"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all"
                        />
                      ) : (
                        <p className="text-sm text-stone-800">{user.phone || <span className="text-stone-400">Not added</span>}</p>
                      )}
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                        Preferred City
                      </label>
                      {editing ? (
                        <select
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all"
                        >
                          <option value="">Select city</option>
                          {INDIAN_CITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-stone-800">{user.city || <span className="text-stone-400">Not set</span>}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security section */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck size={16} className="text-stone-400" />
                  <h2 className="text-base font-bold text-stone-900">Security</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-stone-50">
                    <div>
                      <p className="text-sm font-medium text-stone-800">Password</p>
                      <p className="text-xs text-stone-400">Change your login password</p>
                    </div>
                    <button className="text-xs text-amber-700 font-semibold hover:text-amber-800">
                      Change →
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-stone-800">Delete Account</p>
                      <p className="text-xs text-stone-400">Permanently remove your data</p>
                    </div>
                    <button className="text-xs text-red-500 font-semibold hover:text-red-600">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
