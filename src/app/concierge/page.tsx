"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send, Plus, Trash2, Bot, User,
  MapPin, Phone, CheckCircle2, TrendingUp,
  ThumbsUp, AlertCircle, Sparkles, ChevronDown, ChevronUp,
  Heart, MessageSquare, Clock,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PropertyAction {
  type: string;
  label: string;
  whatsappMessage: string;
}

interface PropertyCard {
  id?: string;
  name: string;
  area: string;
  city: string;
  tier?: number;
  price: number;
  priceLabel: string;
  pricePerSqft?: number;
  priceCalc?: string;
  priceConfidence?: "verified" | "estimated" | "circle-rate-based";
  type: string;
  bedrooms?: number;
  sqft?: number;
  rentalYield?: number;
  description?: string;
  builder?: string;
  pros?: string[];
  cons?: string[];
  status?: string;
  amenities?: string[];
  verifiedStatus?: string;
  reraId?: string;
  reraDisclaimer?: string;
  photoUrl?: string;
  lat?: number;
  lng?: number;
  action?: PropertyAction;
}

interface Message {
  role: "user" | "ai";
  text: string;
  cards?: PropertyCard[];
  timestamp?: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "3BHK in Baner Pune under ₹90L with good schools nearby",
  "Best areas for NRI investment in Bangalore 2025",
  "Compare Powai vs Thane for rental yield",
  "Luxury villa in Hyderabad under ₹3 Cr RERA verified",
];
const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER || "919999999999";
const STORAGE_KEY = "grey_advisor_conversations";
const MAX_CONVERSATIONS = 20;

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convs: Conversation[]) {
  try {
    // Keep only the latest MAX_CONVERSATIONS
    const trimmed = convs.slice(-MAX_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* storage full */ }
}

function newConversation(): Conversation {
  return {
    id: `conv_${Date.now()}`,
    title: "New conversation",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ─── Heart / Wishlist button ──────────────────────────────────────────────────
function WishlistHeart({ card }: { card: PropertyCard }) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if already wishlisted on mount
  useEffect(() => {
    if (!card.id && !card.name) return;
    const key = card.id || card.name;
    const local = localStorage.getItem(`wl_${key}`);
    if (local === "1") setSaved(true);
  }, [card.id, card.name]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);

    const method = saved ? "DELETE" : "POST";
    const propertyId = card.id || card.name.toLowerCase().replace(/\s+/g, "-");
    const key = card.id || card.name;

    try {
      const res = await fetch("/api/wishlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          propertyName: card.name,
          area: card.area,
          city: card.city,
          price: card.price,
          photoUrl: card.photoUrl,
        }),
      });

      if (res.ok) {
        const next = !saved;
        setSaved(next);
        // Cache state in localStorage so it persists per-session
        if (next) {
          localStorage.setItem(`wl_${key}`, "1");
        } else {
          localStorage.removeItem(`wl_${key}`);
        }
      } else if (res.status === 401) {
        // Not logged in — show a gentle tooltip
        alert("Sign in to save properties to your wishlist.");
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm",
        "border backdrop-blur-sm",
        saved
          ? "bg-red-500 border-red-400 text-white scale-110"
          : "bg-white/90 border-white/60 text-stone-400 hover:text-red-400 hover:scale-110",
        loading && "opacity-50 cursor-wait"
      )}
    >
      <Heart
        size={14}
        className={saved ? "fill-white" : ""}
      />
    </button>
  );
}

// ─── Single property card ──────────────────────────────────────────────────────
function ConciergePropertyCard({ card }: { card: PropertyCard }) {
  const [showMore, setShowMore] = useState(false);
  const imgSrc = card.photoUrl || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    card.action?.whatsappMessage ?? `Hi, I'm interested in ${card.name} in ${card.area}.`
  )}`;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

      {/* Photo */}
      <div className="relative h-40 w-full overflow-hidden">
        <Image
          src={imgSrc}
          alt={card.name}
          fill
          className="object-cover"
          unoptimized
        />
        {/* RERA badge */}
        {card.verifiedStatus && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
            <CheckCircle2 size={10} />
            {card.verifiedStatus}
          </div>
        )}
        {/* Price badge */}
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm text-stone-900 font-bold text-xs px-2.5 py-1 rounded-full shadow">
          ₹{card.priceLabel}
        </div>
        {/* ❤️ Wishlist heart — bottom-right of image */}
        <div className="absolute bottom-2 right-2">
          <WishlistHeart card={card} />
        </div>
        {/* Type pill */}
        <div className="absolute bottom-2 left-2 bg-amber-700/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
          {card.type}
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-2.5">

        {/* Title + builder */}
        <div>
          <h4 className="font-bold text-stone-800 text-sm leading-snug">{card.name}</h4>
          {card.builder && (
            <p className="text-[11px] text-stone-400 mt-0.5">by {card.builder}</p>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-[11px] text-stone-500">
          <MapPin size={11} className="text-amber-600 flex-shrink-0" />
          <span>{card.area}, {card.city}</span>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 flex-wrap">
          {card.bedrooms && (
            <span className="bg-stone-50 border border-stone-100 text-stone-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
              {card.bedrooms} BHK
            </span>
          )}
          {card.sqft && (
            <span className="bg-stone-50 border border-stone-100 text-stone-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
              {card.sqft.toLocaleString()} sqft
            </span>
          )}
          {card.pricePerSqft && (
            <span className="bg-stone-50 border border-stone-100 text-stone-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
              ₹{card.pricePerSqft.toLocaleString()}/sqft
            </span>
          )}
          {card.rentalYield && (
            <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp size={9} /> {card.rentalYield}% yield
            </span>
          )}
          {card.tier && (
            <span className="bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
              Tier {card.tier} City
            </span>
          )}
        </div>

        {/* Price calculation transparency + confidence badge */}
        {card.priceCalc && (
          <div className={`rounded-xl px-3 py-2 border ${
            card.priceConfidence === "verified"
              ? "bg-emerald-50 border-emerald-100"
              : card.priceConfidence === "estimated"
              ? "bg-amber-50 border-amber-100"
              : "bg-orange-50 border-orange-100"
          }`}>
            <div className="flex items-center justify-between mb-0.5">
              <p className={`text-[10px] font-semibold ${
                card.priceConfidence === "verified" ? "text-emerald-700"
                  : card.priceConfidence === "estimated" ? "text-amber-700"
                  : "text-orange-700"
              }`}>
                {card.priceConfidence === "verified" ? "✅ Verified pricing" :
                 card.priceConfidence === "estimated" ? "⚠️ Estimated from circle rates" :
                 "📊 National average estimate"}
              </p>
            </div>
            <p className="text-[11px] text-stone-700 font-medium">{card.priceCalc}</p>
          </div>
        )}



        {/* Description */}
        {card.description && (
          <p className="text-[11.5px] text-stone-600 leading-relaxed border-l-2 border-amber-300 pl-2.5 italic">
            {card.description}
          </p>
        )}

        {/* RERA ID */}
        {card.reraId && (
          <div>
            <p className="text-[10px] text-stone-400">RERA: {card.reraId}</p>
            {card.reraDisclaimer && (
              <p className="text-[9px] text-stone-300 mt-0.5">{card.reraDisclaimer}</p>
            )}
          </div>
        )}

        {/* Expand: Pros / Cons / Amenities */}
        {(card.pros?.length || card.cons?.length || card.amenities?.length) && (
          <div>
            <button
              onClick={() => setShowMore((p) => !p)}
              className="flex items-center gap-1 text-[11px] text-amber-700 font-medium hover:underline"
            >
              {showMore ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showMore ? "Less details" : "Full details"}
            </button>
            {showMore && (
              <div className="mt-2 space-y-2">
                {card.pros?.length ? (
                  <div className="space-y-0.5">
                    {card.pros.map((p, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-stone-600">
                        <ThumbsUp size={10} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        {p}
                      </div>
                    ))}
                  </div>
                ) : null}
                {card.cons?.length ? (
                  <div className="space-y-0.5">
                    {card.cons.map((c, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-stone-500">
                        <AlertCircle size={10} className="text-amber-400 mt-0.5 flex-shrink-0" />
                        {c}
                      </div>
                    ))}
                  </div>
                ) : null}
                {card.amenities?.length ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {card.amenities.map((a, i) => (
                      <span key={i} className="bg-amber-50 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-md border border-amber-100">
                        {a}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Google Maps capsule */}
          <a
            href={
              card.lat && card.lng
                ? `https://www.google.com/maps?q=${card.lat},${card.lng}&z=16`
                : `https://www.google.com/maps/search/${encodeURIComponent(`${card.area} ${card.city} property`)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full text-[11px] font-semibold py-2 rounded-full border border-stone-200 bg-stone-50 text-stone-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            <MapPin size={11} className="text-blue-500" />
            📍 View on Google Maps
          </a>
          {/* WhatsApp CTA */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full text-[11px] font-bold py-2 rounded-full bg-amber-700 text-white hover:bg-amber-800 transition-colors shadow-sm"
          >
            <Phone size={11} />
            {card.action?.label ?? "Book Site Visit"}
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar conversation list ────────────────────────────────────────────────
function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  function formatTime(ts: number) {
    const diff = Date.now() - ts;
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return new Date(ts).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  }

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 flex-shrink-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-amber-700" />
          <h2 className="text-sm font-semibold text-stone-700">History</h2>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-700 text-white hover:bg-amber-800 transition-colors"
        >
          <Plus size={11} /> New
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={20} className="text-stone-200 mx-auto mb-2" />
            <p className="text-xs text-stone-400">No conversations yet</p>
          </div>
        ) : (
          [...conversations].reverse().map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "group relative rounded-xl p-3 cursor-pointer transition-all",
                conv.id === activeId
                  ? "bg-amber-50 border border-amber-200"
                  : "hover:bg-stone-50 border border-transparent"
              )}
            >
              <p className={cn(
                "text-xs font-medium truncate pr-5",
                conv.id === activeId ? "text-amber-800" : "text-stone-700"
              )}>
                {conv.title}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Clock size={9} className="text-stone-300" />
                <p className="text-[10px] text-stone-400">{formatTime(conv.updatedAt)}</p>
                <span className="text-[10px] text-stone-300 ml-1">· {conv.messages.length} msgs</span>
              </div>
              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                className="absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-400 text-stone-300 transition-all"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-stone-100">
        <Link
          href="/profile"
          className="flex items-center gap-2 text-xs text-stone-500 hover:text-amber-700 transition-colors"
        >
          <Heart size={12} /> View saved properties
        </Link>
      </div>
    </div>
  );
}

// ─── Chat component (uses useSearchParams — wrapped in Suspense) ───────────────
function ConciergePageContent() {
  const searchParams = useSearchParams();
  const autoFiredRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Conversation state ─────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadConversations();
    if (saved.length > 0) {
      setConversations(saved);
      setActiveId(saved[saved.length - 1].id);
    } else {
      const first = newConversation();
      setConversations([first]);
      setActiveId(first.id);
    }
  }, []);

  // Save to localStorage whenever conversations change
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations);
    }
  }, [conversations]);

  // Get current conversation's messages
  const activeConversation = conversations.find((c) => c.id === activeId);
  const messages = activeConversation?.messages ?? [];

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── Conversation management ────────────────────────────────────────────────
  function createNewConversation() {
    const conv = newConversation();
    setConversations((prev) => [...prev, conv]);
    setActiveId(conv.id);
    setInput("");
  }

  function deleteConversation(id: string) {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        const fresh = newConversation();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) {
        setActiveId(next[next.length - 1].id);
      }
      return next;
    });
  }

  function updateActiveMessages(newMessages: Message[]) {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeId) return c;
        // Auto-generate title from first user message
        const title =
          newMessages.find((m) => m.role === "user")?.text.slice(0, 50) ||
          "New conversation";
        return { ...c, messages: newMessages, title, updatedAt: Date.now() };
      })
    );
  }

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text?: string) => {
      const query = (text ?? input).trim();
      if (!query || isLoading) return;

      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      const userMsg: Message = { role: "user", text: query, timestamp: Date.now() };
      const updatedWithUser = [...messages, userMsg];
      updateActiveMessages(updatedWithUser);
      setIsLoading(true);

      try {
        // Send the last 10 messages as history for context
        const history = updatedWithUser.slice(-10).map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          text: m.text,
        }));

        const res = await fetch("/api/concierge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: query, history }),
        });
        const data = await res.json();
        const reply = data.reply || "Let me try again — please rephrase your query.";
        const aiMsg: Message = { role: "ai", text: reply, cards: data.cards, timestamp: Date.now() };
        updateActiveMessages([...updatedWithUser, aiMsg]);
      } catch {
        const errMsg: Message = {
          role: "ai",
          text: "Network error — please check your connection.",
          timestamp: Date.now(),
        };
        updateActiveMessages([...updatedWithUser, errMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, isLoading, messages, activeId]
  );

  // Auto-fire ?q= param from homepage
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !autoFiredRef.current && conversations.length > 0) {
      autoFiredRef.current = true;
      sendMessage(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conversations.length]);

  // ── Markdown renderer ──────────────────────────────────────────────────────
  function renderInline(text: string): React.ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i} className="font-semibold text-stone-800">{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={i}>{part.slice(1, -1)}</em>;
      return part;
    });
  }

  function renderReply(text: string) {
    if (!text || typeof text !== "string") return <p>—</p>;
    return text.split("\n").map((line, i) => {
      const t = line.trim();
      if (t.startsWith("• ") || t.startsWith("- ") || t.startsWith("* "))
        return (
          <div key={i} className="flex items-start gap-2 my-0.5">
            <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
            <span>{renderInline(t.slice(2))}</span>
          </div>
        );
      if (/^\d+\./.test(t))
        return <p key={i} className="font-semibold text-stone-800 mt-2 mb-0.5">{renderInline(t)}</p>;
      if (t.startsWith("###") || t.startsWith("##") || t.startsWith("#"))
        return <p key={i} className="font-bold text-stone-800 mt-2 mb-0.5 text-sm">{t.replace(/^#+\s*/, "")}</p>;
      if (!t) return <div key={i} className="h-2" />;
      return <p key={i}>{renderInline(line)}</p>;
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-stone-50">

      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={createNewConversation}
        onDelete={deleteConversation}
      />

      {/* Main chat */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

          {/* Welcome screen */}
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-stone-800">Grey</p>
                    <p className="text-xs text-amber-700">Elite AI Real Estate Concierge</p>
                  </div>
                </div>
                <p className="text-stone-600 text-sm leading-relaxed mb-4">
                  I source <strong>RERA-verified</strong> properties, run investment analysis, and help you book site visits — all in one conversation.
                  <br /><span className="text-amber-700 font-medium">❤️ Tap the heart on any property to save it to your wishlist.</span>
                </p>
                <ul className="text-sm text-stone-500 space-y-2">
                  <li>🏡 <strong className="text-stone-700">Verified listings</strong> — RERA-registered, Grade-A builders</li>
                  <li>📊 <strong className="text-stone-700">Investment analysis</strong> — ROI, EMI, price-per-sqft, yield</li>
                  <li>📍 <strong className="text-stone-700">Map view & site visit</strong> — direct location + WhatsApp booking</li>
                  <li>💬 <strong className="text-stone-700">Chat memory</strong> — Grey remembers your conversation context</li>
                </ul>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-left p-3 rounded-xl border border-stone-200 bg-white text-xs text-stone-600 hover:text-amber-800 hover:border-amber-300 hover:bg-amber-50 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn("flex gap-3 max-w-2xl mx-auto w-full", msg.role === "user" ? "flex-row-reverse" : "")}
            >
              {/* Avatar */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                msg.role === "user" ? "bg-amber-700 text-white" : "bg-white border border-stone-200 text-amber-700"
              )}>
                {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>

              <div className="space-y-3 max-w-[88%]">
                {/* Text bubble */}
                <div className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-amber-700 text-white rounded-tr-sm"
                    : "bg-white border border-stone-100 shadow-sm text-stone-700 rounded-tl-sm"
                )}>
                  <p className="text-xs font-semibold mb-1.5 opacity-50">{msg.role === "user" ? "You" : "Grey"}</p>
                  <div className="space-y-0.5 text-sm leading-relaxed">
                    {renderReply(msg.text)}
                  </div>
                </div>

                {/* Property cards */}
                {msg.cards && msg.cards.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {msg.cards.map((card, ci) => (
                      <ConciergePropertyCard key={card.id ?? ci} card={card} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-2xl mx-auto w-full">
              <div className="w-8 h-8 rounded-full bg-white border border-stone-200 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Bot size={14} />
              </div>
              <div className="bg-white border border-stone-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <p className="text-xs text-stone-400 font-medium">Grey is researching</p>
                <div className="flex gap-1">
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
                      style={{ animationDelay: `${j * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="p-4 border-t border-stone-200 bg-white">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 items-end bg-stone-50 rounded-2xl border border-stone-200 px-3 py-2 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="e.g. 3BHK in Powai under ₹1.8 Cr, RERA verified, ready to move..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none py-1"
                style={{ maxHeight: "120px", overflowY: "auto" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "p-2 rounded-xl transition-all flex-shrink-0",
                  input.trim() && !isLoading
                    ? "bg-amber-700 text-white hover:bg-amber-800 shadow-sm"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                )}
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-center text-xs text-stone-400 mt-2">
              Grey AI · RERA-verified recommendations · Always verify independently
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page wrapper ──────────────────────────────────────────────────────────────
export default function ConciergePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-sm text-stone-400">Loading Grey AI...</p>
        </div>
      </div>
    }>
      <ConciergePageContent />
    </Suspense>
  );
}
