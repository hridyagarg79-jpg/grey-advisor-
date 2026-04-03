// lib/ai-router.ts
// Routes AI tasks to the right model based on query content

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export type TaskType = "chat" | "financial" | "complex";

// ─── Task type detection ───────────────────────────────────────────────────────
export function detectTaskType(message: string): TaskType {
  const financialPattern =
    /ltcg|capital gain|tax|roi|yield|emi|interest rate|depreciation|indexation|gst|stamp duty|gross rent|net yield|grm|rental return|investment horizon|annual return|total return|financial|finance|calculator|monthly payment|loan|instalment|installment|return on investment|profit|loss|appreciation|rate of return|price per sqft|sq\.?ft|sqft|rupee|lakh|crore|cr\b|₹|\d+l\b|\d+cr\b/i;
  const complexPattern =
    /compare.*areas|area.*compare|analyze.*portfolio|portfolio.*analysis|investment strategy|5.year plan|10.year|market report|detailed analysis|vs\s+\w+\s+(for|vs)|which is better|should i (invest|buy)|pros.*cons|risk|diversif/i;

  if (financialPattern.test(message)) return "financial";
  if (complexPattern.test(message)) return "complex";
  return "chat";
}

// ─── Fast conversational response — Groq Llama 3.3 70B ──────────────────────
export async function callGroqChat(
  messages: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string,
  maxRetries = 3
): Promise<string | null> {
  const delays = [1000, 2000, 4000];
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.65,
        max_tokens: 4096,
        top_p: 0.9,
      });
      return completion.choices?.[0]?.message?.content ?? null;
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      console.warn(`[AI Router] Groq attempt ${attempt + 1} failed:`, e.status, e.message?.slice(0, 80));
      const shouldRetry = (e.status === 429 || (e.status ?? 0) >= 500) && attempt < maxRetries;
      if (shouldRetry) {
        await new Promise((r) => setTimeout(r, delays[attempt] ?? 4000));
        continue;
      }
      if (attempt === maxRetries) return null;
    }
  }
  return null;
}

// ─── Financial reasoning — Groq with deterministic settings ──────────────────
export async function callGroqFinancial(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string
): Promise<string | null> {
  const FINANCIAL_CONTEXT = `\n\n─── FINANCIAL CALCULATION RULES ───\nFORMULAS (always show working step-by-step):\n- GRY = (Annual Rent / Price) × 100\n- NRY = ((Annual Rent - Expenses) / Price) × 100 [Expenses ≈ maintenance + property tax, ~15-25% of rent]\n- GRM = Price / Annual Gross Rent  \n- EMI = P × r(1+r)^n / ((1+r)^n - 1), where r = monthly rate = annual_rate/12/100, n = tenure in months\n- LTCG (post Jul-2024): flat 12.5% NO indexation (holding > 2 years for property)\n- LTCG (pre Jul-2024): better of (20% + indexation) OR 12.5% flat — choose whichever is lower\n- GST: 0% for ready-to-move, 1% for affordable (<₹45L under-construction), 5% under-construction (non-affordable)\n- Stamp Duty varies by state: Maharashtra 5-6%, Karnataka 3-5%, Delhi 4-6%\n\nALWAYS:\n1. Show all calculations step-by-step with ₹ and L/Cr notation (e.g., ₹50L = ₹50,00,000)\n2. Round EMI to nearest ₹100\n3. State assumptions clearly\n4. Recommend "consult a CA" for LTCG/tax specific queries\n5. Use the Grey concierge persona — professional and decisive`;

  try {
    const allMessages: { role: "user" | "assistant"; content: string }[] = [
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt + FINANCIAL_CONTEXT },
        ...allMessages,
      ],
      temperature: 0.1, // Very low — deterministic math
      max_tokens: 2048,
    });
    return completion.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[AI Router] Financial model error:", err);
    return null;
  }
}

// ─── Complex analysis — Groq with balanced settings ──────────────────────────
export async function callGroqComplex(
  messages: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string
): Promise<string | null> {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.3,
      max_tokens: 4096,
    });
    return completion.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[AI Router] Complex model error:", err);
    return null;
  }
}

// ─── Master router ─────────────────────────────────────────────────────────────
export async function routeMessage(
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string
): Promise<{ text: string; model: string; taskType: TaskType }> {
  const taskType = detectTaskType(message);

  console.log(`[AI Router] Task type: ${taskType} for: "${message.slice(0, 60)}..."`);

  if (taskType === "financial") {
    const result = await callGroqFinancial(message, history, systemPrompt);
    if (result) {
      return { text: result, model: "groq:llama-3.3-70b (financial)", taskType };
    }
    // Fallback to chat mode if financial fails
    console.warn("[AI Router] Financial mode failed, falling back to chat mode");
  }

  if (taskType === "complex") {
    const allMessages = [...history, { role: "user" as const, content: message }];
    const result = await callGroqComplex(allMessages, systemPrompt);
    if (result) {
      return { text: result, model: "groq:llama-3.3-70b (analysis)", taskType };
    }
    console.warn("[AI Router] Complex mode failed, falling back to chat mode");
  }

  // Default/fallback: fast chat
  const allMessages = [...history, { role: "user" as const, content: message }];
  const result = await callGroqChat(allMessages, systemPrompt);
  return {
    text: result ?? "I couldn't process that request. Please try rephrasing your query.",
    model: "groq:llama-3.3-70b",
    taskType,
  };
}
