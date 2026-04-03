---
name: project-conventions
description: Coding conventions, file structure, and patterns specific to the Grey Advisor Next.js project. Always check this skill FIRST before writing any code for this project.
---

# Grey Advisor — Project Conventions

## Project Structure
```
grey-advisor-next/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Homepage wizard
│   │   ├── concierge/page.tsx    # AI chat interface
│   │   ├── map/page.tsx          # MapLibre property map
│   │   ├── properties/[id]/      # Property detail page
│   │   └── api/
│   │       ├── concierge/route.ts    # Main AI chat API
│   │       ├── avm/route.ts          # Valuation API (guardrailed)
│   │       ├── rera-check/route.ts   # RERA check (illustrative)
│   │       ├── properties/route.ts   # Static property data
│   │       └── auth/me/route.ts      # Auth check
│   ├── components/
│   │   ├── Navbar.tsx            # Desktop nav (no "Collections" link)
│   │   ├── MobileNav.tsx         # Bottom tab navigation
│   │   └── [new components here] # Follow Bento Grid UI skill
│   └── lib/
│       ├── financial-calculations.ts  # All money math — never inline
│       ├── validation.ts             # Zod guardrails — always use
│       └── ai-router.ts             # Route to correct model
├── .agents/
│   └── skills/
│       ├── rag-pipeline/SKILL.md
│       ├── indian-re-finance/SKILL.md
│       ├── multi-model-routing/SKILL.md
│       ├── property-scraping/SKILL.md
│       ├── bento-grid-ui/SKILL.md
│       ├── google-places-photos/SKILL.md
│       ├── price-validation/SKILL.md
│       ├── rera-compliance/SKILL.md
│       └── project-conventions/SKILL.md
└── (root)/../data/
    └── properties.json            # 48 static properties
```

## Critical Rules

### 1. Always Use the Lib Functions
```typescript
// ✅ CORRECT
import { calculateGRY, formatIndianCurrency } from "@/lib/financial-calculations";
import { applyPriceGuardrail } from "@/lib/validation";

// ❌ WRONG — never calculate inline
const yield = (rent * 12 / price) * 100; // Don't do this
```

### 2. API Routes Must Always Validate
Every `POST /api/*` that returns financial data must run `applyPriceGuardrail` before responding.

### 3. Port & Dev Server
- Dev: `npm run dev` → `localhost:3001` (port is set in .env.local)
- The legacy Express server on port 3000 is **decommissioned** — do not run `server.js`
- Never change the port without updating `.env.local`

### 4. MapLibre (not Mapbox)
```typescript
// ✅ CORRECT
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ❌ WRONG
import mapboxgl from "mapbox-gl"; // We use MapLibre, not Mapbox
```

### 5. MapLibre Style (English Labels)
```typescript
map.setStyle("https://api.maptiler.com/maps/streets/style.json?key=[KEY]");
// OR free OpenFreeMap:
map.setStyle("https://tiles.openfreemap.org/styles/liberty");
// Force English labels after style load:
map.on("style.load", () => {
  map.getStyle().layers.forEach((layer) => {
    if (layer.type === "symbol" && layer.layout?.["text-field"]) {
      map.setLayoutProperty(layer.id, "text-field", ["coalesce", ["get", "name_en"], ["get", "name"]]);
    }
  });
});
```

### 6. Styling
- **Tailwind v4** is used — no `tailwind.config.js` needed
- Use `@theme` in CSS for design tokens
- `framer-motion` for all animations — no CSS `@keyframes` for component animations
- Color palette: amber/stone/emerald — defined in `globals.css`

### 7. Data Layer
- `properties.json` at `c:\Users\Asus\OneDrive\Documents\grey deaL\data\properties.json`
- Load with `fs.readFileSync(path.join(process.cwd(), "..", "data", "properties.json"))`
- NEVER import properties.json from the client side — always go through the API

### 8. Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL     # Already set ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY # Already set ✅
GROQ_API_KEY                 # Already set ✅
FIRECRAWL_API_KEY=fc-4d81292a378146b2944f9f30e3a00078  # Set in root .env
ANTHROPIC_API_KEY=           # TODO: get from console.anthropic.com
GOOGLE_AI_KEY=               # TODO: get from aistudio.google.com
GOOGLE_PLACES_API_KEY=       # TODO: get from console.cloud.google.com
```

### 9. Concierge Message Format
```typescript
// History sent to API:
{ role: "user" | "model", text: string }[]

// Note: "model" is used in client, mapped to "assistant" in ai-router.ts
```

### 10. No "Collections" Route
The Collections page was removed. Do not add it back. Navigation: Home → Concierge → Map → Properties.

## Common Gotchas
- `maplibregl.Map` fails silently if container has no explicit height — always set `height: 100%` on the div *and* its parent
- Groq rejects role `"model"` — always map to `"assistant"` before sending
- Zod v4 uses `.issues` not `.errors` on `ZodError`
- `pricePerSqft` in properties.json is a string with commas → parse with `parseInt(p.pricePerSqft.replace(/,/g, ""))`
