---
name: rag-pipeline
description: Retrieval-Augmented Generation using Supabase pgvector for Grey Advisor. Use this skill whenever implementing search, concierge recommendations, or any feature that retrieves property data to ground LLM responses.
---

# RAG Pipeline — Grey Advisor

## When to Use
- Any API route that calls an LLM to answer property questions
- AVM valuation (retrieve comparable properties first)
- Concierge recommendations (retrieve matching properties, pass as context)
- Neighbourhood analysis (retrieve local data, ground the response)

## Architecture
```
User Query → Embed Query (Gemini/OpenAI) → pgvector similarity search → Top-K properties → LLM (Groq) with context → Response
```

## Supabase Setup (run once in Supabase SQL editor)
```sql
-- Enable pgvector
create extension if not exists vector;

-- Properties with embeddings
create table if not exists property_embeddings (
  id uuid primary key default gen_random_uuid(),
  property_id text not null,
  content text not null,                    -- text that was embedded
  embedding vector(768),                    -- Gemini embedding-004 = 768 dims
  metadata jsonb,                           -- full property JSON
  city text,
  area text,
  price numeric,
  bedrooms int,
  created_at timestamptz default now()
);

-- IVFFlat index for fast similarity search
create index if not exists property_embeddings_idx
  on property_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- RPC for similarity search
create or replace function match_properties(
  query_embedding vector(768),
  match_count int default 5,
  filter_city text default null,
  filter_max_price numeric default null,
  filter_bedrooms int default null
)
returns table (
  property_id text,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    property_id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from property_embeddings
  where
    (filter_city is null or city = filter_city)
    and (filter_max_price is null or price <= filter_max_price)
    and (filter_bedrooms is null or bedrooms >= filter_bedrooms)
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

## Embedding & Ingestion (TypeScript)
```typescript
// lib/embeddings.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function ingestProperty(property: Record<string, unknown>) {
  const content = [
    `${property.name} in ${property.area}, ${property.city}`,
    `${property.bedrooms} BHK, ${property.sqft} sqft`,
    `Price: ₹${property.priceLabel} (₹${property.pricePerSqft}/sqft)`,
    `Type: ${property.type}`,
    `Builder: ${property.builder}`,
    `Amenities: ${(property.amenities as string[])?.join(", ")}`,
    `RERA: ${property.reraId}`,
  ].join(". ");

  const embedding = await embedText(content);

  await supabase.from("property_embeddings").upsert({
    property_id: String(property.id),
    content,
    embedding,
    metadata: property,
    city: String(property.city).toLowerCase(),
    area: String(property.area),
    price: Number(property.price),
    bedrooms: Number(property.bedrooms),
  });
}

export async function retrieveProperties(
  query: string,
  filters: { city?: string; maxPrice?: number; bedrooms?: number } = {},
  topK = 5
): Promise<Record<string, unknown>[]> {
  const queryEmbedding = await embedText(query);
  const { data, error } = await supabase.rpc("match_properties", {
    query_embedding: queryEmbedding,
    match_count: topK,
    filter_city: filters.city?.toLowerCase() ?? null,
    filter_max_price: filters.maxPrice ?? null,
    filter_bedrooms: filters.bedrooms ?? null,
  });
  if (error) throw error;
  return (data ?? []).map((row: { metadata: Record<string, unknown> }) => row.metadata);
}
```

## Usage in API Route
```typescript
// Always do this BEFORE calling the LLM
const properties = await retrieveProperties(userQuery, { city, maxPrice, bedrooms });
const context = properties.map(p =>
  `${p.name} (${p.area}, ${p.city}): ${p.bedrooms}BHK, ₹${p.priceLabel}, ₹${p.pricePerSqft}/sqft`
).join("\n");

const systemPrompt = `${BASE_SYSTEM_PROMPT}

VERIFIED PROPERTY DATA (use ONLY these for recommendations):
${context}

CRITICAL: Base ALL price figures on the above data. Do not invent prices.`;
```

## Rules
- ALWAYS retrieve before generating — no cold LLM calls for property data
- Minimum 3 properties retrieved; include ALL in context
- If retrieval returns 0 results, tell user "No verified data for this location" — never hallucinate
- Cache embeddings for 24h in Upstash Redis using query hash as key
