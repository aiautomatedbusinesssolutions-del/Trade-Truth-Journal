import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import StatsOverview from "@/components/dashboard/StatsOverview";
import RecentTrades from "@/components/dashboard/RecentTrades";
import DecisionQualityGauge from "@/components/dashboard/DecisionQualityGauge";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import HindsightTrigger from "@/components/dashboard/HindsightTrigger";
import PsychTrendChart from "@/components/dashboard/PsychTrendChart";

function calculateStreak(trades: { is_win: boolean | null }[]) {
  if (trades.length === 0) return { type: "none" as const, count: 0 };

  const first = trades[0];
  if (first.is_win === null) return { type: "none" as const, count: 0 };

  const streakType = first.is_win ? "win" : "loss";
  let count = 0;

  for (const trade of trades) {
    if (trade.is_win === null) break;
    if ((streakType === "win" && trade.is_win) || (streakType === "loss" && !trade.is_win)) {
      count++;
    } else {
      break;
    }
  }

  return { type: streakType as "win" | "loss", count };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch closed trades for stats
  const { data: closedTrades, error: closedError } = await supabase
    .from("trades")
    .select("pnl_amount, is_win, created_at")
    .eq("status", "closed")
    .order("created_at", { ascending: false });

  // Fetch recent trades (all statuses, last 5)
  const { data: recentTrades, error: recentError } = await supabase
    .from("trades")
    .select("id, coin_name, coin_symbol, trade_type, status, pnl_percent, is_win, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch analyses for decision quality
  const { data: analyses, error: analysesError } = await supabase
    .from("trade_analyses")
    .select("process_rating");

  // Fetch pending hindsight checks (due and not completed)
  const { data: pendingHindsight, error: hindsightError } = await supabase
    .from("hindsight_checks")
    .select("id")
    .eq("is_completed", false)
    .lte("check_date", new Date().toISOString());

  // Fetch psych trend data for chart
  const { data: psychTrades, error: psychError } = await supabase
    .from("trades")
    .select("entry_mood, entry_energy, entry_confidence, created_at")
    .eq("status", "closed")
    .order("created_at", { ascending: true })
    .limit(30);

  const psychTrendData = (psychTrades ?? []).map((t) => ({
    date: new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    mood: t.entry_mood,
    energy: t.entry_energy,
    confidence: t.entry_confidence,
  }));

  const queryError = closedError || recentError || analysesError || hindsightError || psychError;

  // Calculate stats
  const closed = closedTrades ?? [];
  const winCount = closed.filter((t) => t.is_win === true).length;
  const lossCount = closed.filter((t) => t.is_win === false).length;
  const totalClosed = winCount + lossCount;
  const winRate = totalClosed > 0 ? (winCount / totalClosed) * 100 : 0;
  const totalPnl = closed.reduce((sum, t) => sum + Number(t.pnl_amount ?? 0), 0);
  const currentStreak = calculateStreak(closed);

  // Decision quality
  const allAnalyses = analyses ?? [];
  const goodProcessCount = allAnalyses.filter((a) => a.process_rating === "good").length;
  const qualityScore = allAnalyses.length > 0
    ? Math.round((goodProcessCount / allAnalyses.length) * 100)
    : 0;

  // Loss streak for alerts
  const lossStreak = currentStreak.type === "loss" ? currentStreak.count : 0;

  return (
    <div>
      <HindsightTrigger />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400">
            Welcome back, {user?.email?.split("@")[0]}
          </p>
        </div>
        <Link
          href="/trade/new"
          className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          New Trade
        </Link>
      </div>

      {queryError && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <p className="text-amber-400 text-sm">
            Some data could not be loaded. You may see incomplete stats.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Alerts */}
        <AlertsPanel
          lossStreak={lossStreak}
          pendingHindsightCount={pendingHindsight?.length ?? 0}
        />

        {/* Stats */}
        <StatsOverview
          winCount={winCount}
          lossCount={lossCount}
          winRate={winRate}
          totalPnl={totalPnl}
          currentStreak={currentStreak}
        />

        {/* Main content grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Decision Quality Gauge */}
          <DecisionQualityGauge
            score={qualityScore}
            goodProcessCount={goodProcessCount}
            totalCount={allAnalyses.length}
          />

          {/* Recent Trades */}
          <RecentTrades trades={recentTrades ?? []} />
        </div>

        {/* Psychology Trend Chart */}
        <PsychTrendChart data={psychTrendData} />
      </div>
    </div>
  );
}
