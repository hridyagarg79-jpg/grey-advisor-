import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/auth/google — initiates Google OAuth via Supabase
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ url: data.url });
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
