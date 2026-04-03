import Link from "next/link";
import { Bot, MapPin, Calculator, TrendingUp, Shield, Building2, Mail } from "lucide-react";

const PLATFORM_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/privacy#cookies" },
  { label: "Disclaimer", href: "/privacy#disclaimer" },
];

const RESOURCE_LINKS = [
  { label: "AI Concierge", href: "/concierge", icon: <Bot size={12} /> },
  { label: "Map Search", href: "/map", icon: <MapPin size={12} /> },
  { label: "EMI Calculator", href: "/emi-calculator", icon: <Calculator size={12} /> },
  { label: "Market Trends", href: "/trends", icon: <TrendingUp size={12} /> },
  { label: "RERA Verification", href: "/rera", icon: <Shield size={12} /> },
  { label: "Area Comparison", href: "/compare-areas", icon: <Building2 size={12} /> },
];

const SUPPORT_LINKS = [
  { label: "Contact Support", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Concierge Help", href: "/concierge" },
  { label: "Sitemap", href: "/sitemap.xml" },
];

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-baseline gap-0.5 mb-3">
              <span className="text-xl font-bold text-stone-900">Grey</span>
              <span className="text-xl font-bold text-amber-700"> Advisor</span>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed max-w-xs mb-4">
              India&apos;s AI-powered real estate advisor. RERA-verified listings, zero advisory fee, 
              and intelligent property concierge — all in one platform.
            </p>
            <a
              href="mailto:support@greyadvisor.in"
              className="flex items-center gap-1.5 text-xs text-amber-700 hover:underline"
            >
              <Mail size={12} /> support@greyadvisor.in
            </a>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-4">Platform</h4>
            <ul className="space-y-3">
              {PLATFORM_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-stone-600 hover:text-amber-700 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-4">Features</h4>
            <ul className="space-y-3">
              {RESOURCE_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-stone-600 hover:text-amber-700 transition-colors flex items-center gap-1.5">
                    <span className="text-stone-400">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-4">Support</h4>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-stone-600 hover:text-amber-700 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* City quick links */}
            <h4 className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-3 mt-6">Cities</h4>
            <div className="flex flex-wrap gap-1.5">
              {["Mumbai", "Pune", "Bangalore", "Hyderabad", "Delhi NCR"].map((city) => (
                <Link
                  key={city}
                  href={`/map?city=${encodeURIComponent(city)}`}
                  className="text-[11px] text-stone-500 bg-stone-50 hover:bg-amber-50 hover:text-amber-700 border border-stone-100 hover:border-amber-200 px-2 py-0.5 rounded-full transition-colors"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} Grey Advisor. RERA Certified Platform. All rights reserved.
          </p>
          <p className="text-xs text-stone-400 text-center sm:text-right max-w-sm">
            Not a SEBI-registered advisor. All content is for informational purposes only.{" "}
            <Link href="/privacy#disclaimer" className="underline hover:text-amber-700">Read disclaimer</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
}
