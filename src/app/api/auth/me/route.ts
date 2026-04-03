import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    // Try to get extended profile from profiles table
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("name, email, phone, city, avatar_url")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      id: user.id,
      name: profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0],
      email: user.email,
      phone: profile?.phone || null,
      city: profile?.city || null,
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
    });
  } catch (err) {
    console.error("Auth me error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
