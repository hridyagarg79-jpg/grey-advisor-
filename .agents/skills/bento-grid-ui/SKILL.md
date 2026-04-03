---
name: bento-grid-ui
description: Bento Grid design system for Grey Advisor property cards and dashboards. Use this skill for any UI component that displays property data, investment metrics, or neighbourhood analysis.
---

# Bento Grid UI System — Grey Advisor

## What is Bento Grid
A modular card layout where different-sized blocks (cells) display compartmentalized information. Named after the Japanese bento box. Popularized by Apple's product pages.

## Core Layout Structure
```tsx
// BentoGrid.tsx — The container
"grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[140px]"

// Cell size variants
"col-span-2 row-span-2"  // Large (hero) — 2×2
"col-span-2 row-span-1"  // Wide — 2×1
"col-span-1 row-span-2"  // Tall — 1×2  
"col-span-1 row-span-1"  // Small — 1×1
```

## Property Card Bento Layout
```tsx
// PropertyBentoCard.tsx
import { motion } from "framer-motion";

interface PropertyBentoCardProps {
  property: {
    id: string;
    name: string;
    area: string;
    city: string;
    priceLabel: string;
    pricePerSqft: number;
    bedrooms: number;
    sqft: number;
    type: string;
    builder: string;
    rentalYield: number;
    reraId: string;
    photoUrl: string;
    pros: string[];
    cons: string[];
    amenities: string[];
    mapLink: string;
    action: { type: string; label: string; whatsappMessage: string };
  };
}

export function PropertyBentoCard({ property }: PropertyBentoCardProps) {
  return (
    <div className="grid grid-cols-4 gap-3 auto-rows-[120px] w-full max-w-3xl">
      
      {/* HERO: Photo + Name — 2×2 */}
      <motion.div
        className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden group cursor-pointer"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <img src={property.photoUrl} alt={property.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-3">
          <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">{property.type}</span>
          <h3 className="text-white font-bold text-base leading-tight">{property.name}</h3>
          <p className="text-white/80 text-xs">{property.area}, {property.city}</p>
        </div>
        {/* RERA badge */}
        <div className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          ✓ RERA
        </div>
      </motion.div>

      {/* PRICE — 1×1 */}
      <motion.div
        className="col-span-1 row-span-1 bg-amber-50 rounded-2xl p-3 flex flex-col justify-between border border-amber-100"
        whileHover={{ backgroundColor: "#fef3c7" }}
      >
        <span className="text-xs text-stone-500 font-medium">PRICE</span>
        <div>
          <p className="text-lg font-bold text-stone-900">₹{property.priceLabel}</p>
          <p className="text-xs text-stone-500">₹{property.pricePerSqft.toLocaleString()}/sqft</p>
        </div>
      </motion.div>

      {/* YIELD — 1×1 */}
      <motion.div
        className="col-span-1 row-span-1 bg-emerald-50 rounded-2xl p-3 flex flex-col justify-between border border-emerald-100"
        whileHover={{ backgroundColor: "#d1fae5" }}
      >
        <span className="text-xs text-stone-500 font-medium">GROSS YIELD</span>
        <div>
          <p className="text-xl font-bold text-emerald-700">{property.rentalYield}%</p>
          <p className="text-xs text-stone-500">annual rental</p>
        </div>
      </motion.div>

      {/* SPECS — 2×1 */}
      <motion.div
        className="col-span-2 row-span-1 bg-stone-50 rounded-2xl p-3 flex gap-4 items-center border border-stone-100"
      >
        <div className="text-center">
          <p className="text-base font-bold text-stone-900">{property.bedrooms}</p>
          <p className="text-xs text-stone-500">BHK</p>
        </div>
        <div className="w-px h-8 bg-stone-200" />
        <div className="text-center">
          <p className="text-base font-bold text-stone-900">{property.sqft.toLocaleString()}</p>
          <p className="text-xs text-stone-500">sqft</p>
        </div>
        <div className="w-px h-8 bg-stone-200" />
        <div className="text-center flex-1">
          <p className="text-sm font-semibold text-stone-900 truncate">{property.builder}</p>
          <p className="text-xs text-stone-500">Builder</p>
        </div>
      </motion.div>

      {/* AMENITIES — 2×1 */}
      <div className="col-span-2 row-span-1 bg-stone-50 rounded-2xl p-3 border border-stone-100">
        <p className="text-xs text-stone-500 font-medium mb-1.5">AMENITIES</p>
        <div className="flex flex-wrap gap-1">
          {property.amenities.slice(0, 4).map((a) => (
            <span key={a} className="text-[10px] bg-white border border-stone-200 rounded-full px-2 py-0.5 text-stone-600">
              {a}
            </span>
          ))}
          {property.amenities.length > 4 && (
            <span className="text-[10px] text-stone-400">+{property.amenities.length - 4} more</span>
          )}
        </div>
      </div>

      {/* ACTIONS — 2×1 */}
      <div className="col-span-2 row-span-1 flex gap-2">
        <a
          href={property.mapLink}
          className="flex-1 bg-stone-900 text-white text-xs font-medium rounded-2xl flex items-center justify-center gap-1.5 hover:bg-stone-700 transition-colors"
        >
          📍 View on Map
        </a>
        <a
          href={`https://wa.me/919999999999?text=${encodeURIComponent(property.action.whatsappMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-amber-600 text-white text-xs font-medium rounded-2xl flex items-center justify-center gap-1.5 hover:bg-amber-700 transition-colors"
        >
          📞 Book Visit
        </a>
      </div>

    </div>
  );
}
```

## Micro-Interactions (Framer Motion)
```tsx
// Stagger animation for multiple cards
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

// Like/Save button with pulse
function LikeButton({ propertyId }: { propertyId: string }) {
  const [liked, setLiked] = useState(false);
  return (
    <motion.button
      onClick={() => setLiked(!liked)}
      whileTap={{ scale: 0.85 }}
      className={`p-2 rounded-full ${liked ? "bg-red-100 text-red-500" : "bg-stone-100 text-stone-400"}`}
    >
      <motion.span animate={liked ? { scale: [1, 1.4, 1] } : {}}>{liked ? "❤️" : "🤍"}</motion.span>
    </motion.button>
  );
}
```

## Mobile Stack (Vertical Feed)
```tsx
// On mobile: col-span-full, standard height cards in a feed
"grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
// Each card on mobile: full width, 260px height
"col-span-1 h-64 md:h-auto"
```

## Color System for Property Data
```css
/* Investment-grade visual hierarchy */
--bento-price: #fef3c7        /* amber-50 — price cells */
--bento-yield-good: #d1fae5   /* emerald-50 — yield > 3.5% */
--bento-yield-ok: #fef9c3     /* yellow-50 — yield 2-3.5% */
--bento-yield-low: #fee2e2    /* red-50 — yield < 2% */
--bento-neutral: #f5f5f4      /* stone-50 — specs, amenities */
--bento-dark: #1c1917         /* stone-900 — CTA buttons */
```

## Rules
- NEVER use plain lists inside a Bento card — every data point gets its own cell
- Price and Yield cells MUST use background color to convey good/bad
- Mobile: always stack vertically (col-span-full) — no horizontal scroll
- Max 3 property Bento cards per concierge response (viewport constraint)
- Always include Like + Map + WhatsApp buttons on every card
