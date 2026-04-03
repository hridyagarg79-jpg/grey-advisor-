import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /auth/callback — Supabase redirects here after Google OAuth
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure profile row exists for OAuth users
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existing) {
        await admin.from("profiles").insert({
          id: data.user.id,
          name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email?.split("@")[0],
          email: data.user.email,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: new Date().toISOString(),
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to error page if something went wrong
  return NextResponse.redirect(`${origin}/auth/signin?error=oauth_error`);
}
