---
name: google-places-photos
description: Automated property photo retrieval using Google Places API (New). Use this skill whenever a property card needs a real photo instead of a hardcoded Unsplash URL.
---

# Google Places Photo Automation — Grey Advisor

## Legal Requirements (MUST FOLLOW)
- Display `authorAttributions[].displayName` on every photo
- Keep Google Maps logo visible (do not crop or hide attribution)
- Cache ONLY `place_id` — NEVER cache photo names or image URLs
- Refreshing photos: always fetch fresh photo resource names (not cached)

## 4-Step Workflow

### Step 1: Text Search → place_id
```typescript
const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
    "X-Goog-FieldMask": "places.id,places.displayName",
  },
  body: JSON.stringify({ textQuery: `${propertyName} ${area} ${city}` }),
});
const { places } = await searchRes.json();
const placeId = places?.[0]?.id;
// ✅ CACHE placeId (tied to property ID in DB)
```

### Step 2: Place Details → photo resource names
```typescript
const detailRes = await fetch(
  `https://places.googleapis.com/v1/places/${placeId}`,
  {
    headers: {
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
      "X-Goog-FieldMask": "photos",
    },
  }
);
const { photos } = await detailRes.json();
const photoName = photos?.[0]?.name;  // e.g. "places/xxx/photos/yyy"
// ❌ DO NOT cache photoName
```

### Step 3: Fetch photo URI
```typescript
const photoRes = await fetch(
  `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&maxWidthPx=1200&skipHttpRedirect=true`,
  { headers: { "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY! } }
);
const { photoUri, authorAttributions } = await photoRes.json();
// photoUri = CDN URL, valid for ~1 hour
// authorAttributions = [{ displayName: "Author Name", uri: "..." }]
```

### Step 4: Display with attribution
```tsx
<figure>
  <img src={photoUri} alt={propertyName} className="w-full h-48 object-cover rounded-t-xl" />
  <figcaption className="text-xs text-stone-400 px-2 py-1">
    Photo by {authorAttributions?.[0]?.displayName ?? "Google Maps"}
    {" · "}
    <img src="https://maps.gstatic.com/mapfiles/api-3/images/google-watermark.png" alt="Google" className="inline h-3" />
  </figcaption>
</figure>
```

## Complete API Route
```typescript
// app/api/property-photo/route.ts
import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache for place_ids only
const placeIdCache = new Map<string, string>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const propertyName = searchParams.get("name") ?? "";
  const area = searchParams.get("area") ?? "";
  const city = searchParams.get("city") ?? "";

  if (!propertyName) return NextResponse.json({ error: "name required" }, { status: 400 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Google Places API not configured" }, { status: 503 });

  const cacheKey = `${propertyName}-${area}-${city}`.toLowerCase();

  try {
    // Step 1: Get or retrieve place_id (cached)
    let placeId = placeIdCache.get(cacheKey);
    if (!placeId) {
      const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id",
        },
        body: JSON.stringify({ textQuery: `${propertyName} ${area} ${city} India` }),
      });
      const searchData = await searchRes.json();
      placeId = searchData.places?.[0]?.id;
      if (placeId) placeIdCache.set(cacheKey, placeId); // Cache place_id only
    }

    if (!placeId) {
      return NextResponse.json({ error: "Property not found on Google Maps", fallback: true });
    }

    // Step 2: Get photo resource name (never cached)
    const detailRes = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "photos" },
    });
    const detailData = await detailRes.json();
    const photoName = detailData.photos?.[0]?.name;

    if (!photoName) {
      return NextResponse.json({ error: "No photos available", fallback: true });
    }

    // Step 3: Get photo URI (never cached)
    const photoRes = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&maxWidthPx=1200&skipHttpRedirect=true`,
      { headers: { "X-Goog-Api-Key": apiKey } }
    );
    const photoData = await photoRes.json();

    return NextResponse.json({
      photoUri: photoData.photoUri,
      attribution: photoData.authorAttributions?.[0]?.displayName ?? "Google Maps",
      placeId,
    });
  } catch (err) {
    console.error("Google Places error:", err);
    return NextResponse.json({ error: "Photo service unavailable", fallback: true });
  }
}
```

## ENV Variable
```env
GOOGLE_PLACES_API_KEY=    # Get from console.cloud.google.com → Enable "Places API (New)"
# Cost: $17/1000 Text Search requests, $5/1000 Place Details, photos are free
```

## Fallback Strategy
If Google Places fails (no API key / rate limit / property not found):
```typescript
const UNSPLASH_FALLBACKS = {
  apartment: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  villa: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
  studio: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  plot: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
  commercial: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  penthouse: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
};
```

## Rules
- Fetch photos at request time, never pre-store photo URLs in DB
- placeId can be stored in property DB record (save an API call)
- Use `skipHttpRedirect=true` to get the JSON response with URI, not a redirect
- Always handle `fallback: true` in frontend gracefully
