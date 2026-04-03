// ─── Curated Unsplash images for Grey Advisor ──────────────────────────────
// Each image is free-to-use from Unsplash, sized at 800×600 for property cards.

const CITY_IMAGES: Record<string, string[]> = {
  Mumbai: [
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
    "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800&q=80",
    "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&q=80",
  ],
  Pune: [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
    "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80",
  ],
  Bangalore: [
    "https://images.unsplash.com/photo-1582407947304-fd86f28f96f7?w=800&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
    "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800&q=80",
  ],
  Hyderabad: [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
  ],
  "Delhi NCR": [
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
    "https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  ],
};

const TYPE_IMAGES: Record<string, string[]> = {
  "Flat / Apartment": [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  ],
  "Independent House": [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
  ],
  Villa: [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
    "https://images.unsplash.com/photo-1613490493576-47a4ef285849?w=800&q=80",
  ],
  "PG / Co-living": [
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80",
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80",
  ],
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
];

/**
 * Get a deterministic Unsplash image URL for a property.
 * Uses city first, then type, then fallback.
 * `seed` is used to pick different images for different properties of the same city.
 */
export function getPropertyImage(city: string, type: string, seed: number = 0): string {
  const cityPool = CITY_IMAGES[city];
  if (cityPool) return cityPool[seed % cityPool.length];

  const typePool = TYPE_IMAGES[type];
  if (typePool) return typePool[seed % typePool.length];

  return FALLBACK_IMAGES[seed % FALLBACK_IMAGES.length];
}

/**
 * Get multiple images for a property gallery (detail page).
 */
export function getPropertyGallery(city: string, type: string, count: number = 4): string[] {
  const cityPool = CITY_IMAGES[city] ?? FALLBACK_IMAGES;
  const typePool = TYPE_IMAGES[type] ?? FALLBACK_IMAGES;

  const combined = [...new Set([...cityPool, ...typePool, ...FALLBACK_IMAGES])];
  return combined.slice(0, count);
}
