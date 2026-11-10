"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Lock, Shield } from "lucide-react";

type Mode = "signup" | "login";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for error from auth callback
  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError === "auth_failed") {
      setError("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/focus");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050810] px-4 py-12">
      <div className="w-full max-w-[400px]">
        {/* Login Card */}
        <div className="relative rounded-2xl border border-[#2b6cff]/40 bg-[#0a1024]/95 backdrop-blur-xl shadow-[0_0_40px_rgba(43,108,255,0.20)] p-8">
          {/* User Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full border-2 border-[#2b6cff] bg-[#050810] flex items-center justify-center shadow-[0_0_20px_rgba(43,108,255,0.4)]">
              <User className="h-8 w-8 text-[#2b6cff]" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-widest text-white uppercase">
              {mode === "login" ? "Awaken" : "Register"}
            </h1>
            <p className="mt-2 text-xs font-mono tracking-widest text-[#6ea8ff] uppercase">
              {mode === "login"
                ? "Identify yourself to access the System."
                : "Create your hunter record to begin."}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded border border-[#ff4d4d]/50 bg-[#3d0a0a]/60 px-4 py-3 font-mono text-xs text-[#ff8080]">
              [ERROR] {error}
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2b6cff]/60 group-focus-within:text-[#2b6cff] transition-colors">
                <User className="h-4 w-4" />
              </div>
              <input
                id="email"
                type="email"
                required
                autoComplete={mode === "login" ? "email" : "new-email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hunter@association.com"
                className="w-full rounded-xl border border-[#2b6cff]/50 bg-[#050810] pl-10 pr-4 py-3 font-mono text-sm text-white placeholder-[#3d5490] outline-none transition-all focus:border-[#2b6cff] focus:ring-1 focus:ring-[#2b6cff] focus:bg-[#050810]"
              />
            </div>

            {/* Password Field */}
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2b6cff]/60 group-focus-within:text-[#2b6cff] transition-colors">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#2b6cff]/50 bg-[#050810] pl-10 pr-4 py-3 font-mono text-sm text-white placeholder-[#3d5490] outline-none transition-all focus:border-[#2b6cff] focus:ring-1 focus:ring-[#2b6cff] focus:bg-[#050810]"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            {mode === "login" && (
              <div className="flex items-center justify-between text-xs font-mono text-[#8fa6d9]/80">
                <label className="flex items-center gap-2 cursor-pointer select-none hover:text-[#6ea8ff] transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border border-[#2b6cff]/50 bg-[#050810] text-[#2b6cff] focus:ring-[#2b6cff]"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setError("Forgot password not yet implemented.")}
                  className="hover:text-[#2b6cff] transition-colors underline underline-offset-2"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-[#2b6cff]/70 bg-[#0f2a6e]/90 px-4 py-3 font-mono text-sm font-bold tracking-[0.25em] text-white uppercase transition-all hover:bg-[#1a3fa0]/90 hover:border-[#2b6cff]/100 hover:shadow-[0_0_20px_rgba(43,108,255,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Connecting..."
                : mode === "login"
                  ? "LOGIN"
                  : "AWAKEN"}
            </button>
          </form>

          {/* Mode Toggle */}
          <div className="mt-8 border-t border-[#2b6cff]/20 pt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="font-mono text-xs tracking-widest text-[#6ea8ff] uppercase transition hover:text-white"
            >
              {mode === "login"
                ? "No hunter record? [ Sign Up ]"
                : "Already awakened? [ Log In ]"}
            </button>
          </div>

          {/* Shield Icon */}
          <div className="mt-8 flex justify-center opacity-30">
            <Shield className="h-8 w-8 text-[#2b6cff]" />
          </div>
        </div>

        {/* Footer text */}
        <p className="mt-6 text-center font-mono text-[10px] tracking-widest text-[#3d5490] uppercase">
          THE SYSTEM — LEVEL 1
        </p>
      </div>
    </main>
  );
}