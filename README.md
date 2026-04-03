# 🏠 Grey Advisor — Agentic AI Real Estate Advisory Platform

> **India's most intelligent property platform.** Discover, compare, and invest with AI-powered insights across Mumbai, Pune, Bangalore, Hyderabad & Delhi NCR.

![Grey Advisor](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript) ![Supabase](https://img.shields.io/badge/Supabase-pgvector-green?logo=supabase) ![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3-orange) ![RERA](https://img.shields.io/badge/RERA-Compliant-emerald)

---

## ✨ What is Grey Advisor?

Grey Advisor is a **next-generation agentic AI real estate platform** that replaces the traditional static filter-based property search with a **prompt-first, conversational discovery model**.

Instead of selecting BHK → price range → area manually, users simply describe what they want in natural language:

> *"3BHK in Baner Pune under ₹90L, RERA verified, good schools nearby, ready to move"*

The AI understands multi-variable intent, runs real investment analysis, and returns verified properties — all in one conversation.

---

## 🚀 Key Features

### 🤖 AI Concierge
- Natural language property search powered by **Groq (LLaMA 3.3 70B)**
- Understands complex multi-variable queries
- Returns structured property cards with full details
- WhatsApp booking integration for site visits
- Conversation history with sidebar

### 📊 AI Property Valuation (AVM)
- Enter city, area, BHK, sqft, building age
- AI estimates market value with **Zod-validated price guardrails** (±20% buffer vs city benchmarks)
- Shows confidence score, market sentiment (bullish/neutral/bearish)
- Bull case & risk factors analysis
- Rental yield estimation

### 🗺️ Interactive Map Search
- MapLibre GL powered property map
- Filter by BHK, price, property type, RERA status
- Cluster view for dense areas
- Property popups with quick details

### 💰 Financial Tools
- **EMI Calculator** — real-time slider with animated number ticker
- **GRY / NRY / GRM** — Gross & Net Rental Yield, Gross Rent Multiplier
- **LTCG Calculator** — 2026 tax framework (12.5% without indexation)
- **GST & Stamp Duty** — city-specific rates
- **ROI & Cap Rate** analysis

### 🏛️ RERA Compliance
- All RERA IDs marked as "Illustrative" with mandatory disclaimer
- Links to state RERA portals for verification
- No fake compliance badges

### 🔥 More Pages
- **Collections** — Curated property collections (Bento grid UI)
- **Neighbourhoods** — Area deep-dives with livability scores
- **Portfolio** — Track your property investments
- **Trends** — Price trend charts with Recharts
- **Compare Areas** — Side-by-side area comparison
- **Wishlist** — Save properties
- **Premium** — Subscription plans

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2 (App Router, Turbopack) |
| **Language** | TypeScript 5.x (strict mode) |
| **Styling** | Tailwind CSS v4 |
| **AI / LLM** | Groq (LLaMA 3.3 70B) via `@ai-sdk/groq` |
| **Auth** | Supabase Auth + `@supabase/ssr` |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **Maps** | MapLibre GL JS |
| **Charts** | Recharts |
| **Validation** | Zod |
| **UI Components** | Magic UI (Bento Grid, Number Ticker, Blur Fade) |
| **Icons** | Lucide React |
| **Fonts** | Inter, DM Serif Display (Google Fonts) |

---

## 🛡️ Agentic AI Architecture

```
User Query
    │
    ▼
AI Router (src/lib/ai-router.ts)
    │
    ├─── Task: Chat/Search ──► Groq LLaMA 3.3 (temp: 0.7)
    │
    ├─── Task: Financial ────► Groq LLaMA 3.3 (temp: 0.1, strict)
    │
    └─── Task: Vision ───────► [Gemini Vision — coming soon]
         │
         ▼
Zod Validation (src/lib/validation.ts)
    │   City-specific price benchmarks
    │   ±20% guardrail — clamps hallucinated prices
    │
    ▼
Response + Property Cards
```

### Skill-Based Development (`.agents/skills/`)
The project uses an **agentic skill system** for modular AI capabilities:

| Skill | Description |
|---|---|
| `rag-pipeline` | Supabase pgvector semantic property search |
| `indian-re-finance` | GRY, NRY, GRM, LTCG, GST calculations |
| `multi-model-routing` | Groq/Claude/Gemini routing matrix |
| `property-scraping` | Firecrawl + Cheerio real-time market data |
| `bento-grid-ui` | Property card design system |
| `google-places-photos` | Real property photos via Places API |
| `price-validation` | Zod guardrail with city benchmarks |
| `rera-compliance` | Legal guardrails and RERA portal links |
| `project-conventions` | Coding standards and architecture rules |

---

## 📁 Project Structure

```
grey-advisor-next/
├── .agents/
│   └── skills/              # Agentic AI skill documentation
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── concierge/   # AI chat API (Groq)
│   │   │   ├── avm/         # Property valuation API
│   │   │   ├── properties/  # Properties data API
│   │   │   └── whatsapp/    # WhatsApp CTA API
│   │   ├── concierge/       # AI Chat page
│   │   ├── avm/             # AI Valuation page
│   │   ├── map/             # Interactive map
│   │   ├── emi-calculator/  # EMI tool
│   │   ├── compare-areas/   # Area comparison
│   │   ├── neighbourhoods/  # Area insights
│   │   ├── portfolio/       # Investment tracker
│   │   ├── trends/          # Price trends
│   │   ├── rera/            # RERA lookup
│   │   ├── wishlist/        # Saved properties
│   │   └── premium/         # Subscription plans
│   ├── components/
│   │   ├── Navbar.tsx        # Full navbar with search
│   │   ├── Footer.tsx
│   │   ├── MobileNav.tsx     # Bottom nav for mobile
│   │   └── ui/              # Magic UI components
│   └── lib/
│       ├── ai-router.ts     # Multi-model AI routing
│       ├── validation.ts    # Zod price guardrails
│       └── financial-calculations.ts  # Indian RE math
├── next.config.ts           # No-cache headers, redirects
├── middleware.ts            # Supabase auth + .html redirect fix
└── .agents/skills/          # Skill repo documentation
```

---

## ⚙️ Environment Variables

Create `.env.local` in the project root:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Groq (Required — AI concierge & valuation)
GROQ_API_KEY=your_groq_api_key

# Anthropic Claude (Optional — enhanced financial reasoning)
ANTHROPIC_API_KEY=sk-ant-...

# Google AI Studio (Optional — Gemini embeddings + RAG)
GOOGLE_AI_KEY=AIza...

# Google Places API (Optional — real property photos)
GOOGLE_PLACES_API_KEY=AIza...
```

> ⚠️ **Security**: Never commit `.env.local` — it's in `.gitignore`.

---

## 🏃 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Installation

```bash
# Clone the repo
git clone https://github.com/hridyagarg79-jpg/grey-advisor-.git
cd grey-advisor-/grey-advisor-next

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔮 Roadmap

- [ ] **RAG Pipeline** — Migrate properties to Supabase pgvector for semantic search
- [ ] **Real-time scraping** — Firecrawl integration for live MagicBricks/99acres prices
- [ ] **Claude integration** — Claude 3.5 Sonnet for superior financial reasoning
- [ ] **Gemini Vision** — Property photo analysis
- [ ] **Google Places photos** — Real property imagery
- [ ] **Supabase Realtime** — Live price updates on map
- [ ] **Mobile app** — React Native companion

---

## 📜 Disclaimer

This platform provides AI-generated advisory content for informational purposes only. All property valuations, RERA IDs shown (unless explicitly verified), and investment analyses are illustrative. Always verify property details independently and consult a SEBI-registered investment advisor before making real estate investment decisions.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built with ❤️ for Indian real estate buyers, investors & NRIs
  <br/>
  <strong>Grey Advisor</strong> — Smart Property Intelligence
</div>
