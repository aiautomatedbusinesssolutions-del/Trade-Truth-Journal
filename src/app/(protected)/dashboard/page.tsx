import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100 mb-2">Dashboard</h1>
      <p className="text-slate-400 mb-6">
        Welcome back, {user?.email?.split("@")[0]}
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <p className="text-slate-400">
          Your trading journal is ready. Start by logging your first trade.
        </p>
      </div>
    </div>
  );
}
