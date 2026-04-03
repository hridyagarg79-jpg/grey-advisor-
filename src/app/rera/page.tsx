"use client";

import { useState } from "react";
import { Search, ShieldCheck, ExternalLink, Loader2, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const STATE_PORTALS = [
  { name: "Maharashtra", url: "https://maharerait.mahaonline.gov.in" },
  { name: "Karnataka", url: "https://rera.karnataka.gov.in" },
  { name: "Telangana", url: "https://rera.telangana.gov.in" },
  { name: "Delhi", url: "https://rera.delhi.gov.in" },
  { name: "Tamil Nadu", url: "https://www.tnrera.in" },
  { name: "Gujarat", url: "https://gujrera.gujarat.gov.in" },
];

const REPUTATION_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  strong: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "🟢 Strong" },
  moderate: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "🟡 Moderate" },
  unknown: { color: "text-stone-600", bg: "bg-stone-50", border: "border-stone-200", label: "⚪ Unknown" },
  concerning: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "🔴 Concerning" },
};

const URGENCY_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: "text-emerald-600", label: "Low — RERA provides strong protection" },
  medium: { color: "text-amber-600", label: "Medium — Verify key details on portal" },
  high: { color: "text-red-600", label: "High — Please verify immediately on official portal" },
};

interface RERAAnalysis {
  projectSummary: string;
  greenFlags: string[];
  redFlags: string[];
  deliveryStatus: string;
  builderReputation: "strong" | "moderate" | "unknown" | "concerning";
  verificationUrgency: "low" | "medium" | "high";
  disclaimer: string;
}

export default function RERAPage() {
  const [regNumber, setRegNumber] = useState("");
  const [projectName, setProjectName] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RERAAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = (regNumber.trim() || projectName.trim()) && !loading;

  async function handleAnalyse() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch("/api/rera-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationNumber: regNumber.trim() || undefined,
          projectName: projectName.trim() || undefined,
          city: city.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Analysis failed");
      setAnalysis(data.analysis);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const reputation = analysis ? REPUTATION_CONFIG[analysis.builderReputation] ?? REPUTATION_CONFIG.unknown : null;
  const urgency = analysis ? URGENCY_CONFIG[analysis.verificationUrgency] ?? URGENCY_CONFIG.medium : null;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-14 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 mb-5">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-4xl font-bold text-stone-900 mb-3">
            RERA Project <span className="text-gradient">Analyser</span>
          </h1>
          <p className="text-stone-500 max-w-xl mx-auto">
            Enter a RERA registration number or project name. Our AI will generate a Red Flags vs. Green Flags advisory report instantly.
          </p>
        </div>

        {/* AI Analyser Card */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
              <span className="text-[10px] font-bold">AI</span>
            </div>
            <p className="text-xs font-semibold tracking-widest text-amber-700 uppercase">AI-Powered Analysis</p>
          </div>
          <p className="text-sm text-stone-500 mb-6">Provide at least one of: RERA registration number or project/builder name.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-2 block">RERA Reg. Number</label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => { setRegNumber(e.target.value); setAnalysis(null); }}
                placeholder="e.g. P51800006289"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-2 block">Project / Developer Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => { setProjectName(e.target.value); setAnalysis(null); }}
                placeholder="e.g. Lodha Palava"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-2 block">City / State (optional)</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai, Maharashtra"
              className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
            />
          </div>

          <button
            onClick={handleAnalyse}
            disabled={!canSubmit}
            className={cn(
              "w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
              canSubmit
                ? "bg-amber-700 text-white hover:bg-amber-800 shadow-sm shadow-amber-900/15"
                : "bg-stone-100 text-stone-400 cursor-not-allowed"
            )}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" />AI is analysing RERA data…</>
            ) : (
              <><Search size={16} />Analyse with AI</>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-5 mb-6 flex items-start gap-3">
            <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Shimmer Skeleton */}
        {loading && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 animate-pulse space-y-5 mb-6">
            <div className="h-4 w-48 bg-stone-100 rounded-full" />
            <div className="h-12 bg-stone-100 rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-stone-100 rounded-2xl" />
              <div className="h-24 bg-stone-100 rounded-2xl" />
            </div>
            <div className="space-y-2">
              {[1,2].map(i => <div key={i} className="h-4 bg-stone-100 rounded-full" />)}
            </div>
          </div>
        )}

        {/* AI Report Card */}
        {!loading && analysis && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden mb-6">
            {/* Report Header */}
            <div className="bg-gradient-to-r from-stone-800 to-stone-700 p-6">
              <p className="text-stone-400 text-xs font-semibold tracking-widest uppercase mb-2 flex items-center gap-2">
                <ShieldCheck size={12} /> AI RERA Advisory Report
              </p>
              <h2 className="text-xl font-bold text-white mb-1">
                {projectName || regNumber}
              </h2>
              {city && <p className="text-stone-400 text-sm">{city}</p>}
            </div>

            <div className="p-6 md:p-8 space-y-6">

              {/* Summary */}
              {analysis.projectSummary && (
                <div className="bg-stone-50 rounded-2xl p-4 border-l-4 border-amber-600">
                  <p className="text-sm text-stone-700 leading-relaxed">{analysis.projectSummary}</p>
                </div>
              )}

              {/* Reputation + Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reputation && (
                  <div className={cn("rounded-2xl p-4 border", reputation.bg, reputation.border)}>
                    <p className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-1">Builder Reputation</p>
                    <p className={cn("text-sm font-bold", reputation.color)}>{reputation.label}</p>
                  </div>
                )}
                {urgency && (
                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                    <p className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-1">Verification Urgency</p>
                    <p className={cn("text-sm font-semibold", urgency.color)}>{urgency.label}</p>
                  </div>
                )}
              </div>

              {/* Delivery Status */}
              {analysis.deliveryStatus && (
                <div className="flex items-start gap-3 bg-stone-50 rounded-xl p-4 border border-stone-200">
                  <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase mb-1">Delivery Status</p>
                    <p className="text-sm text-stone-700">{analysis.deliveryStatus}</p>
                  </div>
                </div>
              )}

              {/* Green Flags vs Red Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Green Flags */}
                <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
                  <p className="text-[10px] font-semibold tracking-widest text-emerald-700 uppercase mb-3 flex items-center gap-1.5">
                    <CheckCircle size={11} /> Green Flags
                  </p>
                  {(analysis.greenFlags || []).length === 0 ? (
                    <p className="text-sm text-stone-500 italic">No green flags identified.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {analysis.greenFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Red Flags */}
                <div className="bg-red-50 rounded-2xl border border-red-100 p-4">
                  <p className="text-[10px] font-semibold tracking-widest text-red-600 uppercase mb-3 flex items-center gap-1.5">
                    <AlertTriangle size={11} /> Red Flags
                  </p>
                  {(analysis.redFlags || []).length === 0 ? (
                    <p className="text-sm text-emerald-700 font-medium">✅ No red flags identified by AI.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {analysis.redFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2.5 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  {analysis.disclaimer || "This is an AI-generated advisory. Always verify on the official state RERA portal before making investment decisions."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* State portals */}
        <div>
          <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-3">Official State RERA Portals</p>
          <div className="flex flex-wrap gap-2">
            {STATE_PORTALS.map((portal) => (
              <a
                key={portal.name}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-stone-200 text-sm text-stone-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition-all"
              >
                {portal.name}
                <ExternalLink size={11} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
