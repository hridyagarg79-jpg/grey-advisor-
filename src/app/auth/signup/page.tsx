"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, ChevronRight, Eye, EyeOff } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign up failed");
      
      if (data.message?.includes("Check your email")) {
        setSuccess("Account created! Check your email to confirm, then sign in.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google sign-in failed");
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Create Account</h1>
          <p className="text-stone-500 text-sm">Join thousands of smart property investors</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-stone-100 p-8">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Google Sign Up */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-stone-200 bg-white text-stone-700 text-sm font-semibold hover:bg-stone-50 hover:border-stone-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-5"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-stone-400 font-medium">or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold tracking-wide text-stone-500 uppercase mb-2">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide text-stone-500 uppercase mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide text-stone-500 uppercase mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading || !email || !password || !name}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed transition-all shadow-sm shadow-amber-900/10 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : null}
              {loading ? "Creating account…" : "Create Account"}
              {!loading && <ChevronRight size={16} />}
            </button>
          </form>

          <p className="text-center text-xs text-stone-400 mt-5">
            By signing up you agree to our{" "}
            <Link href="#" className="text-amber-700 hover:underline">Terms</Link> &{" "}
            <Link href="#" className="text-amber-700 hover:underline">Privacy Policy</Link>
          </p>
        </div>

        <p className="text-center mt-6 text-sm text-stone-500">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-amber-700 font-semibold hover:text-amber-800">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
