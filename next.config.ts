import type { NextConfig } from "next";
import path from "path";

const isProd = process.env.NODE_ENV === "production";
const localModules = path.resolve(__dirname, "node_modules");

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["maplibre-gl"],
  turbopack: {
    resolveAlias: {
      tailwindcss: path.join(localModules, "tailwindcss"),
      "@tailwindcss/postcss": path.join(localModules, "@tailwindcss/postcss"),
    },
  },

  // ── Permanently redirect all old .html URLs → correct Next.js routes ────────
  // This fixes Chrome serving cached pages from the old Express/static app.
  async redirects() {
    return [
      { source: "/index.html",       destination: "/",            permanent: true },
      { source: "/concierge.html",   destination: "/concierge",   permanent: true },
      { source: "/collections.html", destination: "/collections", permanent: true },
      { source: "/map.html",         destination: "/map",         permanent: true },
      { source: "/invest.html",      destination: "/invest",      permanent: true },
      { source: "/profile.html",     destination: "/profile",     permanent: true },
      { source: "/wishlist.html",    destination: "/wishlist",    permanent: true },
      { source: "/premium.html",     destination: "/premium",     permanent: true },
      { source: "/signin.html",      destination: "/auth/signin", permanent: true },
      { source: "/signup.html",      destination: "/auth/signup", permanent: true },
      // Catch-all: any other .html → strip extension
      { source: "/:page.html",       destination: "/:page",       permanent: true },
    ];
  },

  async headers() {
    if (!isProd) {
      // Dev: kill all browser caching so stale pages NEVER appear
      return [
        {
          source: "/:path*",
          headers: [
            { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
            { key: "Pragma", value: "no-cache" },
            { key: "Expires", value: "0" },
          ],
        },
      ];
    }
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://basemaps.cartocdn.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://cartodb-basemaps-a.global.ssl.fastly.net https://cartodb-basemaps-b.global.ssl.fastly.net https://cartodb-basemaps-c.global.ssl.fastly.net https://cartodb-basemaps-d.global.ssl.fastly.net https://*.supabase.co https://images.unsplash.com wss://*.supabase.co",
              "frame-src 'self' https://my.matterport.com",
              "worker-src blob:",
              "font-src 'self' https://fonts.gstatic.com data:",
              "media-src 'self' blob: https://assets.mixkit.co https://player.vimeo.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
