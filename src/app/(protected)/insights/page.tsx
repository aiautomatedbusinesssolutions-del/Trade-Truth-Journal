import { createClient } from "@/lib/supabase/server";
import PatternReport from "@/components/insights/PatternReport";

export default async function InsightsPage() {
  const supabase = await createClient();

  // Count closed trades
  const { count } = await supabase
    .from("trades")
    .select("id", { count: "exact", head: true })
    .eq("status", "closed");

  // Get most recent pattern analysis
  const { data: latestAnalysis } = await supabase
    .from("pattern_analyses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Insights</h1>
        <p className="text-slate-400">
          Deep pattern analysis across all your trades
        </p>
      </div>

      <PatternReport
        existingAnalysis={latestAnalysis ?? null}
        closedTradeCount={count ?? 0}
      />
    </div>
  );
}
