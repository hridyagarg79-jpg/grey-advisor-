import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // ── Strip .html extension permanently ──────────────────────────────────────
  // Fixes: Chrome cached /concierge.html from old Express app → redirect to /concierge
  const { pathname, search } = request.nextUrl;
  if (pathname.endsWith(".html")) {
    const cleanPath = pathname.slice(0, -5) || "/"; // remove .html
    const url = request.nextUrl.clone();
    url.pathname = cleanPath;
    url.search = search;
    return NextResponse.redirect(url, { status: 308 }); // 308 = Permanent Redirect (keeps POST)
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — keeps users logged in across navigations
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
