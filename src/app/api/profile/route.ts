import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/profile — returns the full user profile from the profiles table
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    // If no profile row yet, return auth metadata
    const result = profile || {
      id: user.id,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0],
      email: user.email,
      avatar_url: user.user_metadata?.avatar_url || null,
      phone: null,
      city: null,
      preferences: {},
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("Profile GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/profile — update profile fields
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const updates = await req.json();
    // Only allow safe fields
    const { name, phone, city, preferences } = updates;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(city !== undefined && { city }),
        ...(preferences !== undefined && { preferences }),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Profile updated", profile: data });
  } catch (err) {
    console.error("Profile PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
