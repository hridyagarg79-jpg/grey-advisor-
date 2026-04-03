import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase error messages to user-friendly ones
      if (
        error.message.includes("Invalid login") ||
        error.message.includes("invalid_credentials") ||
        error.message.includes("Email not confirmed")
      ) {
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const { user } = data;

    return NextResponse.json({
      message: "Signed in successfully.",
      user: {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split("@")[0],
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Signin error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
