"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin, BedDouble, Maximize2, TrendingUp, ChevronLeft,
  ArrowRight, Heart, Share2, ShieldCheck, CheckCircle2, XCircle, Rotate3D, X as XIcon
} from "lucide-react";
import { getPropertyGallery } from "@/lib/images";
import { cn } from "@/lib/utils";

interface Property {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  area: string;
  city: string;
  type: string;
  status: string;
  bedrooms?: number;
  sqft?: number;
  pricePerSqft?: number;
  rentalYield?: number;
  description?: string;
  builder?: string;
  pros?: string[];
  cons?: string[];
  amenities?: string[];
  featured?: boolean;
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Rotate through a few demo Matterport / Google Street View 360 embeds
  // In production, map property.id -> your listing's embed URL
  const TOUR_URLS = [
    "https://my.matterport.com/show/?m=SFR96LFXETT&play=1&qs=1",
    "https://my.matterport.com/show/?m=mURjtjULSD5&play=1&qs=1",
    "https://my.matterport.com/show/?m=aSx1MpRRqif&play=1&qs=1",
  ];
  const tourUrl = TOUR_URLS[parseInt(id ?? "0", 36) % TOUR_URLS.length];

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/properties?id=${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setProperty(data);
      } catch {
        router.push("/map");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-700 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!property) return null;

  const images = getPropertyGallery(property.city, property.type, 4);

  const pros = property.pros ?? [
    "Good connectivity to metro/highway",
    "Reputed builder with track record",
    "Appreciating micro-market",
    "Clear RERA registration",
  ];

  const cons = property.cons ?? [
    "Under-construction — possession in 2026",
    "Limited social infrastructure nearby",
  ];

  const amenities = property.amenities ?? [
    "Clubhouse", "Swimming Pool", "Gymnasium",
    "24/7 Security", "Power Backup", "EV Charging",
  ];

  const pricePerSqft = property.pricePerSqft ?? (
    property.sqft ? Math.round(property.price / property.sqft) : null
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-500 mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-amber-700 transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
        <span className="text-stone-300">/</span>
        <Link href="/map" className="hover:text-amber-700 transition-colors">Map Search</Link>
        <span className="text-stone-300">/</span>
        <span className="text-stone-700 font-medium truncate max-w-[200px]">{property.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT — Gallery + Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Gallery */}
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
            {/* Main image */}
            <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
              <img
                key={activeImage}
                src={images[activeImage]}
                alt={property.name}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              {/* Overlay badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                {property.featured && (
                  <span className="bg-amber-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Premium
                  </span>
                )}
                <span className="bg-white/90 text-stone-700 text-xs font-medium px-3 py-1 rounded-full border border-stone-200 capitalize">
                  {property.status}
                </span>
              </div>
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => setSaved(!saved)}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm",
                    saved ? "bg-red-500 text-white" : "bg-white/90 text-stone-600 hover:text-red-500"
                  )}
                >
                  <Heart size={16} className={saved ? "fill-white" : ""} />
                </button>
                <button className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-stone-600 hover:text-amber-700 shadow-sm transition-colors">
                  <Share2 size={16} />
                </button>
              </div>
            </div>
            {/* Thumbnail strip */}
            <div className="flex gap-2 p-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "flex-1 aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all",
                    activeImage === i ? "border-amber-700" : "border-transparent opacity-60 hover:opacity-80"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* 360° Virtual Tour */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                  <Rotate3D size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-800 text-sm">360° Virtual Tour</h3>
                  <p className="text-xs text-stone-500">Immersive walkthrough — explore every room</p>
                </div>
              </div>
              <button
                onClick={() => setShowTour(!showTour)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                  showTour
                    ? "border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                    : "border-amber-700 bg-amber-700 text-white hover:bg-amber-800"
                )}
              >
                {showTour ? <><XIcon size={13} /> Exit Tour</> : <><Rotate3D size={13} /> Enter 360° Tour</>}
              </button>
            </div>

            {showTour && (
              <div className="border-t border-stone-100">
                <div className="relative" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={tourUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="xr-spatial-tracking; gyroscope; accelerometer"
                    allowFullScreen
                    title="360° Virtual Tour"
                    style={{ border: "none" }}
                  />
                </div>
                <p className="text-center text-[10px] text-stone-400 py-2">
                  Use mouse or touch to look around · Click &amp; drag to navigate
                </p>
              </div>
            )}
          </div>

          {/* Overview */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-1">
              <h1 className="text-2xl font-bold text-stone-900 leading-tight pr-4">{property.name}</h1>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-amber-800">₹{property.priceLabel}</p>
                {pricePerSqft && (
                  <p className="text-xs text-stone-400">₹{pricePerSqft.toLocaleString()}/sqft</p>
                )}
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-stone-500 mb-5">
              <MapPin size={14} className="text-amber-700" />
              {property.area}, {property.city}
            </p>

            {/* Key specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Type", value: property.type.replace(" / ", "/"), icon: "🏠" },
                { label: "BHK", value: property.bedrooms ? `${property.bedrooms} BHK` : "—", icon: <BedDouble size={16} /> },
                { label: "Size", value: property.sqft ? `${property.sqft.toLocaleString()} sqft` : "—", icon: <Maximize2 size={16} /> },
                { label: "Yield", value: property.rentalYield ? `${property.rentalYield}% p.a.` : "N/A", icon: <TrendingUp size={16} /> },
              ].map((spec) => (
                <div key={spec.label} className="bg-stone-50 rounded-xl p-3 text-center">
                  <div className="text-stone-400 flex justify-center mb-1 text-sm">{spec.icon}</div>
                  <p className="text-xs text-stone-400 mb-0.5">{spec.label}</p>
                  <p className="text-sm font-bold text-stone-800">{spec.value}</p>
                </div>
              ))}
            </div>

            {property.builder && (
              <p className="text-sm text-stone-500 mb-4">
                <span className="font-medium text-stone-700">Builder:</span> {property.builder}
              </p>
            )}

            <p className="text-sm text-stone-600 leading-relaxed">
              {property.description ??
                `${property.name} is a thoughtfully designed ${property.type?.toLowerCase()} in ${property.area}, ${property.city}. 
                Situated in one of the city's most sought-after micro-markets, the project offers excellent connectivity, 
                modern amenities, and strong appreciation potential. Ideal for both self-use and long-term investment.`}
            </p>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
              <h3 className="font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                <CheckCircle2 size={18} /> Why to Buy
              </h3>
              <ul className="space-y-2">
                {pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-700">
                    <span className="mt-0.5 flex-shrink-0">✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
              <h3 className="font-semibold text-red-700 mb-4 flex items-center gap-2">
                <XCircle size={18} /> Watch Out For
              </h3>
              <ul className="space-y-2">
                {cons.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-600">
                    <span className="mt-0.5 flex-shrink-0">⚠</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <h3 className="font-semibold text-stone-800 mb-4">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => (
                <span key={a} className="px-3 py-1.5 rounded-full border border-stone-200 text-xs font-medium text-stone-600 bg-stone-50">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Sticky Contact + Tools */}
        <div className="lg:col-span-1 space-y-4">

          {/* CTA Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sticky top-20">
            <div className="mb-4 pb-4 border-b border-stone-100">
              <p className="text-2xl font-bold text-amber-800 mb-0.5">₹{property.priceLabel}</p>
              {pricePerSqft && (
                <p className="text-xs text-stone-400">₹{pricePerSqft.toLocaleString()} per sqft</p>
              )}
            </div>

            <div className="space-y-3 mb-5">
              <button className="w-full py-3 rounded-full bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors flex items-center justify-center gap-2">
                Schedule a Visit <ArrowRight size={14} />
              </button>
              <Link
                href={`/concierge?q=${encodeURIComponent(`Tell me about ${property.name} in ${property.city}`)}`}
                className="w-full py-3 rounded-full border border-stone-200 text-stone-700 text-sm font-medium hover:border-amber-400 hover:text-amber-700 transition-colors flex items-center justify-center gap-2"
              >
                Ask Grey AI About This
              </Link>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-500 bg-stone-50 rounded-xl p-3">
              <ShieldCheck size={14} className="text-amber-700 flex-shrink-0" />
              RERA Verified · Zero Brokerage Deals
            </div>
          </div>

          {/* EMI Quick Calc */}
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
            <h3 className="font-semibold text-stone-800 mb-1 text-sm">EMI Estimate</h3>
            <p className="text-xs text-stone-500 mb-3">Based on 80% loan, 8.5% rate, 20 yrs</p>
            {(() => {
              const principal = property.price * 0.8;
              const r = 8.5 / 12 / 100;
              const n = 20 * 12;
              const emi = Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
              return (
                <p className="text-2xl font-bold text-amber-800">
                  ₹{emi.toLocaleString("en-IN")}<span className="text-sm font-normal text-stone-500">/mo</span>
                </p>
              );
            })()}
            <Link href="/emi-calculator" className="text-xs text-amber-700 font-medium mt-2 inline-block hover:underline">
              Customise in calculator →
            </Link>
          </div>

          {/* Similar properties link */}
          <div className="bg-white rounded-2xl border border-stone-100 p-4 text-center">
            <p className="text-xs text-stone-500 mb-2">Looking for more options?</p>
            <Link
              href={`/map?city=${property.city}`}
              className="inline-flex items-center gap-1.5 text-sm text-amber-700 font-semibold hover:text-amber-900"
            >
              More in {property.city} <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
