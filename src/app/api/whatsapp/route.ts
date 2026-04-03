import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// WhatsApp system prompt — concise for messaging format
const WA_SYSTEM_PROMPT = `You are Grey — India's AI real estate advisor, replying via WhatsApp. Keep responses SHORT (max 3 paragraphs). Use plain text, not markdown. Include key numbers (price/sqft, yield %) in every reply. End with one specific question to keep the conversation going. Be direct, friendly, and data-driven. If asked about a city, give 2-3 key insights plus a typical price range. Never use HTML or asterisks for formatting.`;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function escapeXml(str: string) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getFallbackReply(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("pune")) return "Pune market: Baner ~₹8,000/sqft, Hinjewadi ~₹6,500/sqft, Kharadi ~₹7,200/sqft. Average rental yield: 3.5%. Strong tech-sector demand makes it a top investment city. Which area interests you most?";
  if (lower.includes("mumbai")) return "Mumbai market: Andheri ₹18,000–22,000/sqft, Thane ₹10,000–13,000/sqft, Panvel ₹6,000–8,000/sqft. Rental yields: 2.5–3.5%. For investment, Thane/Navi Mumbai offer better ROI. What's your budget?";
  if (lower.includes("bangalore") || lower.includes("bengaluru")) return "Bangalore market: Whitefield ₹7,500–9,500/sqft, Sarjapur ₹6,500–8,000/sqft, Electronic City ₹5,000–6,500/sqft. Rental yields: 3–4%. Whitefield #1 for IT rental demand. What type of property are you considering?";
  if (lower.includes("hyderabad")) return "Hyderabad market: Gachibowli ₹8,000–11,000/sqft, Kondapur ₹7,000–9,000/sqft, Narsingi ₹5,500–7,000/sqft. Rental yield: 3.5–4.5%. HMDA approvals make it buyer-friendly. What's your target area?";
  if (lower.includes("roi") || lower.includes("yield") || lower.includes("return")) return "Rental yields across India: Mumbai 2.5–3.5%, Pune 3–4%, Bangalore 3–4%, Hyderabad 3.5–4.5%, Goa (holiday) 5–8%. Capital appreciation: 8–15%/yr in well-chosen micro markets. Which city are you targeting?";
  return "Hi! I'm Grey, your AI real estate advisor. Ask me about property prices in any city, rental yields, area comparisons, or investment analysis. What city or topic can I help you with?";
}

// ─── POST /api/whatsapp — Twilio Webhook ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Twilio sends form-encoded data
    const formData = await req.formData();
    const incomingMsg = ((formData.get("Body") as string) || "").trim();

    let reply = "";

    if (!incomingMsg) {
      reply = "Hi! I'm Grey, your AI real estate advisor. Ask me anything — '3BHK in Pune under 70L', 'Is Whitefield a good investment?', etc.";
    } else if (process.env.GROQ_API_KEY?.startsWith("gsk_")) {
      try {
        const result = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: WA_SYSTEM_PROMPT },
            { role: "user", content: incomingMsg },
          ],
          temperature: 0.7,
          max_tokens: 400,
        });
        reply = result.choices?.[0]?.message?.content || getFallbackReply(incomingMsg);
      } catch {
        reply = getFallbackReply(incomingMsg);
      }
    } else {
      reply = getFallbackReply(incomingMsg);
    }

    // Respond with TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Message>${escapeXml(reply)}</Message>\n</Response>`;
    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Sorry, I'm having trouble right now. Please try again.</Message></Response>`, {
      headers: { "Content-Type": "text/xml" },
    });
  }
}

// ─── GET /api/whatsapp — Status check ─────────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    status: "active",
    groqEnabled: process.env.GROQ_API_KEY?.startsWith("gsk_") ?? false,
    twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"}/api/whatsapp`,
    instructions: "Configure Twilio WhatsApp Sandbox webhook to point to /api/whatsapp",
  });
}
