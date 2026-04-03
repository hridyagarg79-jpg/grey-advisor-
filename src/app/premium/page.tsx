"use client";

import { useState } from "react";
import { Check, Diamond, Shield, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "Standard",
    price: "₹0",
    period: "",
    desc: "Basic property discovery",
    features: [
      "Access to all basic listings",
      "Standard filtering tools",
      "Save up to 5 properties",
      "Basic AI Concierge queries",
    ],
    cta: "Current Plan",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro Advisor",
    price: "₹499",
    period: "/mo",
    desc: "For serious property seekers",
    features: [
      "Unlimited AI Concierge queries",
      "Access to Premium flagged listings",
      "Save unlimited properties",
      "Area price trend history",
      "WhatsApp alerts for new matches",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    id: "expert",
    name: "Expert Investor",
    price: "₹999",
    period: "/mo",
    desc: "Data-driven investment & ROI",
    features: [
      "Everything in Pro",
      "5-Year ROI & Yield Projections",
      "Legal & RERA compliance reports",
      "Builder track record analysis",
      "Direct channel partner discounts",
    ],
    cta: "Upgrade to Expert",
    popular: false,
  },
];

export default function PremiumPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (planId === "free") return;
    setLoadingPlan(planId);
    setTimeout(() => {
      alert(`Razorpay Demo: Generating payment link for ${planId} plan.`);
      setLoadingPlan(null);
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-14 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 mb-5">
            <Diamond size={24} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4">
            Unlock the Complete <span className="text-gradient">Grey Experience</span>
          </h1>
          <p className="text-stone-500 max-w-2xl mx-auto text-lg">
            Institutional-grade analytics, premium inventory access, and unlimited AI advisory for a fraction of broker fees.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "rounded-2xl border p-8 flex flex-col relative overflow-hidden transition-all",
                plan.popular
                  ? "bg-amber-700 border-amber-700 shadow-xl shadow-amber-900/20 md:-translate-y-3"
                  : "bg-white border-stone-200 hover:border-stone-300 hover:shadow-md"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-8 bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-b-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-5">
                <h3 className={cn("text-lg font-bold mb-1", plan.popular ? "text-white" : "text-stone-900")}>
                  {plan.name}
                </h3>
                <p className={cn("text-sm", plan.popular ? "text-amber-100" : "text-stone-500")}>{plan.desc}</p>
              </div>

              <div className="mb-7">
                <span className={cn("text-4xl font-extrabold", plan.popular ? "text-white" : "text-stone-900")}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={cn("text-sm font-medium ml-1", plan.popular ? "text-amber-200" : "text-stone-400")}>
                    {plan.period}
                  </span>
                )}
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className={cn("flex items-start gap-2.5 text-sm", plan.popular ? "text-amber-50" : "text-stone-600")}>
                    <Check size={16} className={cn("flex-shrink-0 mt-0.5", plan.popular ? "text-amber-200" : "text-amber-700")} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.id === "free" || loadingPlan === plan.id}
                className={cn(
                  "w-full py-3 rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-2",
                  plan.popular
                    ? "bg-white text-amber-800 hover:bg-amber-50"
                    : plan.id === "free"
                    ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                    : "bg-amber-700 text-white hover:bg-amber-800"
                )}
              >
                {loadingPlan === plan.id ? "Processing…" : plan.cta}
                {plan.id !== "free" && !loadingPlan && <ChevronRight size={15} />}
              </button>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-14 text-center">
          <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-4">Secure & Trusted</p>
          <div className="flex gap-8 items-center justify-center text-stone-400">
            <div className="flex items-center gap-1.5 text-sm font-medium"><Shield size={15} /> Razorpay Secured</div>
            <div className="flex items-center gap-1.5 text-sm font-medium"><Zap size={15} /> 256-bit AES</div>
          </div>
        </div>
      </div>
    </div>
  );
}
