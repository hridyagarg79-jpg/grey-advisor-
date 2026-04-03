import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// ─── POST /api/payment/create-order ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "create-order";

  if (action === "verify") {
    return handleVerify(req);
  }
  return handleCreateOrder(req);
}

async function handleCreateOrder(req: NextRequest) {
  try {
    const { plan, amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Demo mode when Razorpay keys are not yet configured
    if (!keyId || !keySecret || keyId.includes("placeholder")) {
      return NextResponse.json({
        demoMode: true,
        order_id: `demo_order_${Date.now()}`,
        amount,
        currency: "INR",
        plan,
        key: "rzp_test_demo",
        message: "Razorpay not configured — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local",
      });
    }

    // Real Razorpay order creation (dynamic import to avoid crashing when pkg is absent)
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await (razorpay.orders.create as Function)({
      amount,
      currency: "INR",
      receipt: `grey_${plan}_${Date.now()}`,
      notes: { plan, platform: "grey-advisor" },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: keyId,
      plan,
    });
  } catch (err: any) {
    console.error("Razorpay order error:", err.message);
    return NextResponse.json({ error: "Payment order creation failed" }, { status: 500 });
  }
}

async function handleVerify(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await req.json();
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret || keySecret.includes("placeholder")) {
      return NextResponse.json({ success: true, demoMode: true, plan, message: "Demo payment verified" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSig = crypto.createHmac("sha256", keySecret).update(body).digest("hex");

    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Signature verification failed" }, { status: 400 });
    }

    return NextResponse.json({ success: true, plan, payment_id: razorpay_payment_id });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

// ─── GET /api/payment — status check ─────────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    razorpayConfigured: !!(process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes("placeholder")),
    currency: "INR",
  });
}
