import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge-compatible middleware.
 * Supabase session refresh is handled per-request in Server Components
 * via createServerClient — middleware only does the lightweight .html strip.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Strip legacy .html extension (Chrome cached old Express routes)
  if (pathname.endsWith(".html")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -5) || "/";
    url.search = search;
    return NextResponse.redirect(url, { status: 308 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next internals and static assets — only run on real page routes
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
