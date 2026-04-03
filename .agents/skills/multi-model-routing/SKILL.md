---
name: multi-model-routing
description: Routes AI tasks to the right model — Groq Llama for fast chat, Gemini Flash for vision/vibe, Claude Sonnet for financial/tax reasoning. Use this skill whenever adding or modifying any API route that calls an LLM.
---

# Multi-Model AI Routing — Grey Advisor

## Decision Matrix

| Task Type | Model | Why | Latency |
|---|---|---|---|
| Conversational chat, quick property search | `llama-3.3-70b-versatile` via Groq | Ultra-fast, <2s | ~1.5s |
| Financial calc, tax, LTCG, ROI analysis | `claude-3-5-sonnet-20241022` via Anthropic | Best instruction-following for math | ~5s |
| Photo analysis, vibe matching, image description | `gemini-1.5-flash-latest` via Google | Native multimodal | ~3s |
| Embedding property text for RAG | `text-embedding-004` via Google | 768-dim, free tier | ~0.5s |
| Complex multi-step reasoning chains | `claude-3-5-sonnet-20241022` | Best for structured long outputs | ~8s |

## Implementation — Vercel AI SDK (Installed)

```typescript
// lib/ai-router.ts
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!);

export type TaskType = "chat" | "financial" | "vision" | "complex";

export function detectTaskType(message: string): TaskType {
  const financialKeywords = /ltcg|capital gain|tax|roi|yield|emi|interest|depreciation|indexation|gst|stamp duty|gross rent|net yield|grm/i;
  const visionKeywords = /photo|image|look|show me|vibe|aesthetic|feel|appearance|neighborhood photo/i;
  const complexKeywords = /compare.*areas|analyze.*portfolio|investment strategy|5.year|10.year/i;

  if (financialKeywords.test(message)) return "financial";
  if (visionKeywords.test(message)) return "vision";
  if (complexKeywords.test(message)) return "complex";
  return "chat";
}

// Fast chat — Groq Llama
export async function callGroq(
  messages: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string
): Promise<string> {
  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: systemPrompt,
    messages,
    temperature: 0.65,
    maxTokens: 4096,
  });
  return text;
}

// Financial reasoning — Claude
export async function callClaude(
  userMessage: string,
  systemPrompt: string
): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  return (msg.content[0] as { text: string }).text;
}

// Vision / vibe analysis — Gemini Flash
export async function callGeminiVision(
  prompt: string,
  imageUrl?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: prompt }];

  if (imageUrl) {
    const res = await fetch(imageUrl);
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = res.headers.get("content-type") ?? "image/jpeg";
    parts.push({ inlineData: { mimeType, data: base64 } });
  }

  const result = await model.generateContent(parts);
  return result.response.text();
}

// Master router — use this in API routes
export async function routeToModel(
  message: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string,
  imageUrl?: string
): Promise<{ text: string; model: string }> {
  const taskType = detectTaskType(message);

  switch (taskType) {
    case "financial":
    case "complex":
      return { text: await callClaude(message, systemPrompt), model: "claude-3-5-sonnet" };
    case "vision":
      return { text: await callGeminiVision(message, imageUrl), model: "gemini-1.5-flash" };
    default:
      return {
        text: await callGroq([...conversationHistory, { role: "user", content: message }], systemPrompt),
        model: "llama-3.3-70b"
      };
  }
}
```

## Financial System Prompt for Claude
```typescript
export const CLAUDE_FINANCIAL_PROMPT = `You are a senior Indian real estate financial analyst with expertise in:
- Indian property market valuations (Tier 1, 2, and 3 cities)
- 2026 Indian tax framework: LTCG 12.5% flat (post-July 2024 purchases), 0% GST on ready-to-move
- Yield calculations: GRY, NRY, GRM, Total ROI
- Home loan EMI calculations using standard amortization

FORMULAS TO USE:
- GRY = (Annual Rent / Price) × 100
- NRY = ((Annual Rent - Expenses) / Price) × 100  
- GRM = Price / Annual Gross Rent
- EMI = P × r × (1+r)^n / ((1+r)^n - 1), where r = monthly rate, n = months
- LTCG Tax (post Jul-24) = (Sale Price - Purchase Price) × 12.5%

OUTPUT FORMAT:
- Show all calculations step by step
- Use Indian number format (₹ with L/Cr notation)
- Flag if any input seems outside normal market range
- Always recommend consulting a CA for tax matters`;
```

## Required ENV Variables
```env
GROQ_API_KEY=             # Already set ✅
ANTHROPIC_API_KEY=        # Get from console.anthropic.com — needed for Claude
GOOGLE_AI_KEY=            # Get from aistudio.google.com — needed for Gemini
```

## Rules
- NEVER call Claude for simple property searches — it's 3x slower and more expensive
- ALWAYS use Groq for conversational responses under 2s requirement
- Use Gemini for anything with images — it is FREE at 15 RPM on Flash
- Add `model` field to all API responses so the UI can show which model answered
- Fallback: if Claude/Gemini fails, fall back to Groq (never show error to user)
