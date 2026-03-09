import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          Trade Truth Journal
        </h1>
        <p className="text-slate-400 mb-6">
          Stop Guessing. Start Journaling. Win Consistently.
        </p>
        <div className="flex justify-center gap-3 mb-8">
          <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full text-sm">
            Win
          </span>
          <span className="text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full text-sm">
            Wait
          </span>
          <span className="text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full text-sm">
            Loss
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="border border-slate-700 hover:border-slate-600 text-slate-300 font-medium py-2.5 rounded-lg transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
