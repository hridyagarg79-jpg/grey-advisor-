import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      if (
        error.message.includes("already registered") ||
        error.message.includes("already exists") ||
        error.message.includes("User already registered")
      ) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const user = data.user;

    // Create profile row using admin client (bypasses RLS)
    if (user) {
      const admin = createAdminClient();
      await admin.from("profiles").upsert({
        id: user.id,
        name,
        email: user.email,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        message: data.session
          ? "Account created successfully."
          : "Account created! Check your email to confirm.",
        user: user
          ? {
              id: user.id,
              name: user.user_metadata?.name || name,
              email: user.email,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
