"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-slate-100">
          Trade Truth
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-slate-100 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/trade/new"
            className="text-sm text-slate-400 hover:text-slate-100 transition-colors"
          >
            New Trade
          </Link>
          <Link
            href="/trade/history"
            className="text-sm text-slate-400 hover:text-slate-100 transition-colors"
          >
            History
          </Link>
          <Link
            href="/insights"
            className="text-sm text-slate-400 hover:text-slate-100 transition-colors"
          >
            Insights
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-500 hover:text-rose-400 transition-colors ml-2"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
