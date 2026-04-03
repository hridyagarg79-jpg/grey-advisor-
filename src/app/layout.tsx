import type { Metadata } from "next";
import { Inter, DM_Serif_Display, Geist_Mono } from "next/font/google";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grey Advisor — Smart Real Estate Advisor",
  description:
    "India's most intelligent property platform. Discover, compare, and invest with AI-powered insights across Mumbai, Pune, Bangalore, Hyderabad & Delhi NCR.",
  keywords: ["real estate", "property advisor", "PG", "investment", "India", "Grey Advisor"],
  openGraph: {
    title: "Grey Advisor — Smart Real Estate Advisor",
    description: "AI-powered property discovery for Indian metros.",
    type: "website",
  },
  // Force browsers to never cache — prevents old Express static site appearing
  other: {
    "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
    pragma: "no-cache",
    expires: "0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        {/* Footer: desktop only — mobile uses the drawer instead */}
        <div className="hidden md:block">
          <Footer />
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
