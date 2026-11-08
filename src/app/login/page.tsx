"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Mode = "signup" | "login";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session?.user.email ?? null);
    });
  }, [supabase.auth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          setSession(data.session?.user.email ?? null);
          setMessage("Sign up successful! You are logged in.");
        } else {
          setMessage(
            "Registration complete. Confirm your identity via the link sent to your email.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSession(email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
    setSession(null);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050810] px-4 py-12">
      <div className="w-full max-w-md">
        {/* System window frame */}
        <div className="relative rounded-lg border-2 border-[#2b6cff]/60 bg-[#0a1024]/90 shadow-[0_0_40px_rgba(43,108,255,0.25)] backdrop-blur">
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-[#2b6cff]/40 px-5 py-3">
            <span className="font-mono text-xs tracking-[0.35em] text-[#6ea8ff] uppercase">
              {mode === "login" ? "Authorization" : "Registration"}
            </span>
            <span className="font-mono text-xs text-[#2b6cff]">
              [SYSTEM]
            </span>
          </div>

          <div className="px-6 py-8 sm:px-8">
            {/* Title */}
            <h1 className="text-center text-2xl font-bold tracking-widest text-white uppercase">
              {mode === "login" ? "Awakened Hunter" : "Awaken"}
            </h1>
            <p className="mt-2 text-center font-mono text-xs text-[#8fa6d9]">
              {mode === "login"
                ? "Identify yourself to access the System."
                : "Enter your credentials to accept the awakening."}
            </p>

            {/* Session banner (logged out) */}
            {session && (
              <div className="mt-4 rounded border border-[#2b6cff]/40 bg-[#0f1a3d]/60 px-4 py-3 text-center font-mono text-sm text-[#6ea8ff]">
                Session active: {session}
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="mt-2 block w-full rounded border border-[#ff4d4d]/60 px-3 py-1.5 font-mono text-xs tracking-widest text-[#ff8080] uppercase transition hover:bg-[#ff4d4d]/10 disabled:opacity-50"
                >
                  {loading ? "..." : "Log Out"}
                </button>
              </div>
            )}

            {/* Auth form */}
            {!session && (
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block font-mono text-xs tracking-widest text-[#6ea8ff] uppercase"
                  >
                    &gt; Player ID (Email)
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hunter@association.com"
                    className="w-full rounded border border-[#2b6cff]/50 bg-[#050810] px-4 py-2.5 font-mono text-sm text-white placeholder-[#3d5490] outline-none transition focus:border-[#2b6cff] focus:shadow-[0_0_12px_rgba(43,108,255,0.35)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block font-mono text-xs tracking-widest text-[#6ea8ff] uppercase"
                  >
                    &gt; Access Key (Password)
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded border border-[#2b6cff]/50 bg-[#050810] px-4 py-2.5 font-mono text-sm text-white placeholder-[#3d5490] outline-none transition focus:border-[#2b6cff] focus:shadow-[0_0_12px_rgba(43,108,255,0.35)]"
                  />
                </div>

                {error && (
                  <p className="rounded border border-[#ff4d4d]/50 bg-[#3d0a0a]/60 px-4 py-2.5 font-mono text-xs text-[#ff8080]">
                    [ERROR] {error}
                  </p>
                )}

                {message && (
                  <p className="rounded border border-[#2b6cff]/50 bg-[#0f1a3d]/60 px-4 py-2.5 font-mono text-xs text-[#6ea8ff]">
                    [SYSTEM] {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded border-2 border-[#2b6cff]/70 bg-[#0f2a6e]/60 px-4 py-3 font-mono text-sm font-bold tracking-[0.25em] text-white uppercase transition hover:bg-[#1a3fa0]/70 hover:shadow-[0_0_20px_rgba(43,108,255,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Connecting..."
                    : mode === "login"
                      ? "Log In"
                      : "Sign Up"}
                </button>
              </form>
            )}

            {/* Mode toggle */}
            {!session && (
              <div className="mt-6 border-t border-[#2b6cff]/20 pt-4 text-center">
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setError(null);
                    setMessage(null);
                  }}
                  className="font-mono text-xs tracking-widest text-[#6ea8ff] uppercase transition hover:text-white"
                >
                  {mode === "login"
                    ? "No hunter record? [ Sign Up ]"
                    : "Already awakened? [ Log In ]"}
                </button>
              </div>
            )}
          </div>

          {/* Corner accents */}
          <span className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-[#2b6cff]" />
          <span className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-[#2b6cff]" />
          <span className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-[#2b6cff]" />
          <span className="absolute -right-1 -bottom-1 h-4 w-4 border-r-2 border-b-2 border-[#2b6cff]" />
        </div>

        <p className="mt-4 text-center font-mono text-[10px] tracking-widest text-[#3d5490]">
          ARISE — YOU HAVE REACHED LEVEL 1
        </p>
      </div>
    </main>
  );
}
