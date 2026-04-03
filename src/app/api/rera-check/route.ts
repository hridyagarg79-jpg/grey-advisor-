import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const RERA_SYSTEM_PROMPT = `You are a RERA (Real Estate Regulatory Authority) compliance expert for India with deep knowledge of Indian real estate law, builder reputations, and project histories.

Given a RERA registration number and/or project name, provide an advisory analysis. Return ONLY a valid JSON object:
{
  "projectSummary": "<2-3 sentence overview of the project/builder if known>",
  "greenFlags": [
    "<positive indicator 1>",
    "<positive indicator 2>",
    "<positive indicator 3>"
  ],
  "redFlags": [
    "<risk or concern 1 if any>"
  ],
  "deliveryStatus": "<e.g. 'Likely completed or near completion based on typical timelines' or 'Under construction, verify on portal'>",
  "builderReputation": "strong" | "moderate" | "unknown" | "concerning",
  "verificationUrgency": "low" | "medium" | "high",
  "disclaimer": "This is an AI-generated advisory. Always verify on the official state RERA portal before making investment decisions."
}

Rules:
- If you recognize the RERA number or builder, share relevant knowledge.
- For unknown/made-up numbers, still provide general advisory about what to check.
- greenFlags should always have at least 2 items (general RERA benefits if nothing specific known).
- redFlags can be empty array [] if no concerns.
- Be honest when you don't have specific data: "Unable to verify specific project data — general RERA protections apply."
- Return ONLY the JSON. No explanation, no markdown fences.`;

export async function POST(req: NextRequest) {
  try {
    const { registrationNumber, projectName, city } = await req.json();

    if (!registrationNumber && !projectName) {
      return NextResponse.json(
        { error: "Provide a RERA registration number or project name" },
        { status: 400 }
      );
    }

    const userMessage = `RERA Query:
- Registration Number: ${registrationNumber || "not provided"}
- Project/Developer Name: ${projectName || "not provided"}
- City/State: ${city || "not specified"}

Provide a RERA compliance advisory for this project.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: RERA_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 512,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || "{}";
    const clean = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

    let analysis: Record<string, unknown> = {};
    try {
      analysis = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ analysis, registrationNumber, projectName });
  } catch (err) {
    console.error("RERA check error:", err);
    return NextResponse.json({ error: "RERA analysis service unavailable" }, { status: 500 });
  }
}
