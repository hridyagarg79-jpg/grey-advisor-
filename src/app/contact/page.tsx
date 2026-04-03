"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send, CheckCircle2, Bot } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "General Inquiry", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production, wire to Resend / Formspree / EmailJS
    setSubmitted(true);
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest text-amber-700 uppercase mb-2">Get in touch</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-3">Contact Us</h1>
          <p className="text-stone-500">Have a question? We typically respond within 24 hours.</p>
        </div>

        {/* Direct options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <a href="mailto:support@greyadvisor.in" className="bg-white border border-stone-100 rounded-2xl p-5 flex items-center gap-3 hover:border-amber-200 hover:shadow-sm transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Mail size={18} className="text-amber-700" />
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-sm">Email Support</p>
              <p className="text-xs text-stone-500">support@greyadvisor.in</p>
            </div>
          </a>
          <Link href="/concierge" className="bg-white border border-stone-100 rounded-2xl p-5 flex items-center gap-3 hover:border-amber-200 hover:shadow-sm transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Bot size={18} className="text-amber-700" />
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-sm">Ask Grey AI</p>
              <p className="text-xs text-stone-500">Instant answers 24/7</p>
            </div>
          </Link>
        </div>

        {/* Form */}
        {submitted ? (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">Message Sent!</h3>
            <p className="text-stone-500 text-sm mb-6">We&apos;ve received your message and will respond within 24 hours at {form.email}.</p>
            <Link href="/" className="text-sm text-amber-700 underline font-medium">Back to Home</Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <MessageSquare size={18} className="text-amber-700" />
              <h2 className="font-bold text-stone-900">Send a Message</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1 block">Name *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1 block">Email *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  {["General Inquiry", "Technical Issue", "RERA Concern", "Partnership", "Press & Media", "Data Correction"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Message *</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Tell us how we can help..."
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-500 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-700 text-white font-semibold hover:bg-amber-800 transition-colors text-sm"
              >
                <Send size={15} /> Send Message
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
