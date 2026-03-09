"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AuthFormProps {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-slate-100 mb-1 text-center">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-slate-400 text-center mb-6">
          {mode === "login"
            ? "Sign in to your journal"
            : "Start your trading journal"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-slate-400 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-slate-400 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Min. 6 characters"
            />
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading
              ? "Loading..."
              : mode === "login"
              ? "Sign In"
              : "Sign Up"}
          </button>
        </form>

        <p className="text-slate-400 text-sm text-center mt-6">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-sky-400 hover:text-sky-300">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-sky-400 hover:text-sky-300">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
