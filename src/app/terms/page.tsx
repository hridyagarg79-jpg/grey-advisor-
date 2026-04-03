import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Grey Advisor",
  description: "Terms and conditions for using Grey Advisor, India's AI real estate platform.",
};

const TERMS = [
  {
    title: "1. Acceptance",
    body: "By accessing or using Grey Advisor, you agree to be bound by these Terms. If you disagree with any part, you may not use the service.",
  },
  {
    title: "2. Permitted Use",
    body: "Grey Advisor is for personal, non-commercial use. You may not scrape, copy, or redistribute our data, AI outputs, or design without written permission.",
  },
  {
    title: "3. No Advisory Relationship",
    body: "Nothing on Grey Advisor constitutes financial, legal, or investment advice. We are an information platform. Always consult a certified financial advisor or RERA-registered agent before making property decisions.",
  },
  {
    title: "4. AI & Data Accuracy",
    body: "Our AI concierge and valuation tools are powered by large language models and may occasionally produce inaccurate information. Property prices, RERA IDs, and builder information should be independently verified. Grey Advisor is not liable for decisions made based on AI outputs.",
  },
  {
    title: "5. User Content",
    body: "If you submit queries, wishlist items, or portfolio data, you grant Grey Advisor a non-exclusive license to use this anonymized data to improve our services.",
  },
  {
    title: "6. Intellectual Property",
    body: "The Grey Advisor name, logo, design system, and AI platform are proprietary. Unauthorized use is strictly prohibited.",
  },
  {
    title: "7. Limitation of Liability",
    body: "Grey Advisor is provided 'as is'. We are not liable for any direct, indirect, or consequential damages arising from use of the platform, including reliance on property valuations, AI recommendations, or market data.",
  },
  {
    title: "8. Governing Law",
    body: "These Terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.",
  },
  {
    title: "9. Changes",
    body: "We may update these Terms at any time. Continued use after changes constitutes acceptance of the new Terms.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest text-amber-700 uppercase mb-2">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-3">Terms of Service</h1>
          <p className="text-stone-500">Last updated: January 2025</p>
        </div>

        <div className="space-y-4">
          {TERMS.map((term) => (
            <div key={term.title} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
              <h2 className="font-bold text-stone-900 mb-2">{term.title}</h2>
              <p className="text-sm text-stone-600 leading-relaxed">{term.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3 flex-wrap">
          <Link href="/privacy" className="text-sm text-amber-700 underline font-medium">Privacy Policy</Link>
          <Link href="/contact" className="text-sm text-amber-700 underline font-medium">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
