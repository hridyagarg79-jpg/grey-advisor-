---
name: property-data-scraping
description: Real-time property data retrieval using Firecrawl and Cheerio. Use this skill to get actual current listings instead of relying on the static properties.json or LLM hallucinations.
---

# Property Data Scraping — Grey Advisor

## When to Use
- User queries about Tier 2/3 cities not in properties.json
- AVM needs comparable recent transactions
- Concierge needs current market prices for a specific micro-market
- RERA check needs current project status

## Firecrawl MCP Usage (In This Dev Environment)
The Firecrawl MCP is available in the Antigravity environment. Use it to scrape:
- MagicBricks: `https://www.magicbricks.com/property-for-sale/residential-real-estate?proptype=Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment&cityName={CITY}&BudgetMin={MIN}&BudgetMax={MAX}`
- 99acres: `https://www.99acres.com/search/property/buy/{city}?preference=S&area_unit=1&res_com=R`

## API Route Implementation (Firecrawl NPM)
```typescript
// lib/property-scraper.ts
import FirecrawlApp from "@mendable/firecrawl-js";
import * as cheerio from "cheerio";

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

export interface ScrapedProperty {
  name: string;
  area: string;
  city: string;
  priceLabel: string;
  pricePerSqft?: number;
  bedrooms?: number;
  source: string;
  url: string;
}

export async function scrapeCurrentListings(
  city: string,
  bedrooms?: number,
  maxBudgetLakhs?: number
): Promise<ScrapedProperty[]> {
  const citySlug = city.toLowerCase().replace(/\s+/g, "-");

  try {
    // Use Firecrawl to scrape MagicBricks
    const result = await firecrawl.scrapeUrl(
      `https://www.magicbricks.com/property-for-sale/residential-real-estate?cityName=${encodeURIComponent(city)}&proptype=Multistorey-Apartment`,
      {
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 15000,
      }
    );

    if (!result.success || !result.markdown) return [];

    // Parse the markdown to extract property data
    const properties: ScrapedProperty[] = [];
    const lines = result.markdown.split("\n");

    // Simple price extraction (₹ patterns)
    for (const line of lines) {
      const priceMatch = line.match(/₹\s*([\d.]+)\s*(L|Lac|Lakh|Cr|Crore)/i);
      if (priceMatch) {
        const value = parseFloat(priceMatch[1]);
        const unit = priceMatch[2].toLowerCase();
        const priceInLakhs = unit.startsWith("cr") ? value * 100 : value;

        if (!maxBudgetLakhs || priceInLakhs <= maxBudgetLakhs) {
          properties.push({
            name: "Listed Property",
            area: city,
            city,
            priceLabel: priceMatch[0],
            source: "magicbricks",
            url: `https://www.magicbricks.com`,
          });
        }
      }
    }

    return properties.slice(0, 10);
  } catch {
    return [];
  }
}

// Get current ₹/sqft for a micro-market
export async function getCurrentPricePerSqft(
  city: string,
  area: string
): Promise<{ min: number; max: number; avg: number; source: string } | null> {
  try {
    const searchQuery = `${area} ${city} property price per sqft 2025 2026`;
    // Use Firecrawl search
    const result = await firecrawl.search(searchQuery, {
      limit: 5,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    });

    if (!result.success || !result.data?.length) return null;

    const prices: number[] = [];
    for (const item of result.data) {
      const text = item.markdown || "";
      const matches = text.matchAll(/₹\s*([\d,]+)\s*(?:per\s*sq\.?\s*ft|\/sqft|psf)/gi);
      for (const match of matches) {
        const price = parseInt(match[1].replace(/,/g, ""));
        if (price > 1000 && price < 100000) prices.push(price);
      }
    }

    if (!prices.length) return null;
    prices.sort((a, b) => a - b);
    return {
      min: prices[0],
      max: prices[prices.length - 1],
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      source: "web-scraped",
    };
  } catch {
    return null;
  }
}
```

## ENV Variable Needed
```env
FIRECRAWL_API_KEY=fc-4d81292a378146b2944f9f30e3a00078  # Already in .env ✅
```

## Usage in Concierge Route
```typescript
// In /api/concierge/route.ts — BEFORE calling LLM
// 1. Extract city + area from user message
// 2. Try to get real price data
const realPrices = await getCurrentPricePerSqft(city, area);

// 3. Pass real prices as context to LLM
const priceContext = realPrices
  ? `VERIFIED CURRENT MARKET DATA: ${area}, ${city} = ₹${realPrices.min.toLocaleString()}–₹${realPrices.max.toLocaleString()}/sqft (avg ₹${realPrices.avg.toLocaleString()}/sqft). Source: ${realPrices.source}. Use ONLY these price ranges — do NOT deviate by more than 15%.`
  : "";
```

## Rules
- Scraping is best-effort — always have a fallback (static properties.json)
- Rate limit: scrape max once per unique (city, area) pair per hour → cache in Redis
- Never scrape more than 3 URLs per user request (latency concern)
- Always attribute source: "Data from MagicBricks" in responses
- RERA portal scraping: use state-specific URLs (MahaRERA, RERA Karnataka, etc.)
