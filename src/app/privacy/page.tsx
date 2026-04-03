import { Shield, FileText, Cookie, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Grey Advisor",
  description: "How Grey Advisor collects, uses, and protects your personal information.",
};

const sections = [
  {
    id: "collection",
    icon: <FileText size={18} />,
    title: "Information We Collect",
    content: [
      "**Account data:** When you create an account, we collect your name, email, and phone number (optional).",
      "**Search queries:** Your property searches and concierge conversations are stored to improve AI recommendations.",
      "**Usage data:** Pages visited, features used, and interaction patterns (anonymized).",
      "**Device data:** Browser type, device model, OS — used only for crash reporting and performance monitoring.",
    ],
  },
  {
    id: "use",
    icon: <Shield size={18} />,
    title: "How We Use Your Information",
    content: [
      "To personalize AI concierge recommendations based on your stated preferences.",
      "To send you relevant property alerts if you opt-in to email notifications.",
      "To improve our search algorithms and valuation models.",
      "We never sell your data to third parties. Your data is yours.",
    ],
  },
  {
    id: "cookies",
    icon: <Cookie size={18} />,
    title: "Cookies & Tracking",
    content: [
      "We use essential cookies for authentication and session management.",
      "Analytics cookies (Google Analytics) help us understand usage patterns — these can be opted out.",
      "We do not use advertising or tracking cookies.",
      "You can clear cookies at any time via your browser settings.",
    ],
  },
  {
    id: "disclaimer",
    icon: <AlertTriangle size={18} />,
    title: "Disclaimer",
    content: [
      "Grey Advisor is not a SEBI-registered investment advisor, RERA agent, or licensed broker.",
      "All property information, valuations, and AI recommendations are for informational purposes only and should not be construed as financial or legal advice.",
      "Always verify RERA registration on the official state RERA portal before investing.",
      "Consult a certified CA for tax-related queries (LTCG, stamp duty, GST).",
      "Grey Advisor makes no guarantee of the accuracy of third-party data including property prices, RERA IDs, or builder information.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest text-amber-700 uppercase mb-2">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-3">Privacy Policy</h1>
          <p className="text-stone-500">Last updated: January 2025 · Effective immediately.</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-6 text-sm text-stone-600 leading-relaxed">
          This Privacy Policy explains how <strong>Grey Advisor</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) handles your personal information when you use our platform. 
          By using Grey Advisor, you agree to this policy.
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} id={section.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                  {section.icon}
                </div>
                <h2 className="text-lg font-bold text-stone-900">{section.title}</h2>
              </div>
              <ul className="space-y-2.5">
                {section.content.map((item, i) => (
                  <li key={i} className="text-sm text-stone-600 leading-relaxed flex gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                    <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
          <strong>Questions?</strong> Email us at{" "}
          <a href="mailto:privacy@greyadvisor.in" className="underline font-medium">privacy@greyadvisor.in</a>
        </div>
      </div>
    </div>
  );
}
