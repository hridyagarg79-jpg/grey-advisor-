import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

// Load properties from parent data directory
const DATA_PATH = path.join(process.cwd(), "..", "data", "properties.json");
let allProperties: Record<string, unknown>[] = [];
try {
  allProperties = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
} catch {
  allProperties = [];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const city = searchParams.get("city");
  const type = searchParams.get("type");
  const purpose = searchParams.get("purpose");
  const maxBudget = searchParams.get("budget") ? Number(searchParams.get("budget")) * 100000 : null;
  const bedrooms = searchParams.get("bedrooms") ? Number(searchParams.get("bedrooms")) : null;
  const category = searchParams.get("category");
  const areaKeyword = searchParams.get("areaKeyword");
  const limit = Number(searchParams.get("limit") || 50);
  const page = Number(searchParams.get("page") || 1);
  const id = searchParams.get("id");

  // Single property lookup
  if (id) {
    const prop = allProperties.find((p) => p.id === id || String(p.id) === id);
    if (!prop) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    return NextResponse.json(prop);
  }

  // Filter
  let filtered = [...allProperties];

  if (city) filtered = filtered.filter((p) => String(p.city).toLowerCase() === city.toLowerCase());
  if (type) filtered = filtered.filter((p) => String(p.type).toLowerCase() === type.toLowerCase());
  if (purpose) filtered = filtered.filter((p) => String(p.purpose ?? p.category ?? "").toLowerCase().includes(purpose.toLowerCase()));
  if (maxBudget) filtered = filtered.filter((p) => Number(p.price) <= maxBudget);
  if (bedrooms) filtered = filtered.filter((p) => Number(p.bedrooms) >= bedrooms);
  if (category) filtered = filtered.filter((p) => String(p.category ?? "").toLowerCase() === category.toLowerCase());
  if (areaKeyword) filtered = filtered.filter((p) => String(p.area ?? "").toLowerCase().includes(areaKeyword.toLowerCase()));

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    properties: paginated,
    total,
    page,
    pages: Math.ceil(total / limit),
    cities: [...new Set(allProperties.map((p) => p.city))].sort(),
  });
}
