"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function switchMode(m: "signin" | "signup") {
    setMode(m);
    setError(null);
    setSuccess(null);
    setShowPassword(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard/page1");
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (signUpError) throw signUpError;

        // If session is immediately available (email confirmation disabled), go straight in
        if (signUpData.session) {
          router.push("/dashboard/page1");
          return;
        }

        // Otherwise auto sign-in
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          // Email confirmation required — ask user to confirm
          setSuccess("Account created! Please check your email to confirm, then sign in.");
          switchMode("signin");
        } else {
          router.push("/dashboard/page1");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-gray-50">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #e9434a 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #ff8c42 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-sm mx-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div
            className="px-8 pt-8 pb-6 text-center"
            style={{ background: "linear-gradient(to bottom, rgba(233,67,74,0.04), transparent)" }}
          >
            <div className="flex justify-center mb-4">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #ff6b6b 0%, #e9434a 50%, #ff8c42 100%)",
                  boxShadow: "0 8px 24px rgba(233,67,74,0.35)",
                }}
              >
                <span className="text-white text-xl font-black tracking-tighter">F</span>
              </div>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">FRAMMER AI</h1>
            <p className="text-xs text-gray-400 mt-1">
              {mode === "signin" ? "Sign in to your dashboard" : "Create your account"}
            </p>
          </div>

          {/* Tabs */}
          <div className="mx-6 mb-6 flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                mode === "signin" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                mode === "signup" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">

            {/* Name — Sign Up only */}
            {mode === "signup" && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Shubham Kumar"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>

            {/* Password with show/hide */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder-gray-300 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    /* Eye-off */
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    /* Eye */
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                <p className="text-xs text-emerald-700">{success}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading ? "#ccc" : "linear-gradient(135deg, #e9434a 0%, #c93040 100%)",
                boxShadow: loading ? "none" : "0 4px 16px rgba(233,67,74,0.35)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  {mode === "signin" ? "Signing in…" : "Creating account…"}
                </span>
              ) : mode === "signin" ? (
                "Sign In →"
              ) : (
                "Create Account →"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-4">
          AI-powered video analytics dashboard
        </p>
      </div>
    </div>
  );
}
