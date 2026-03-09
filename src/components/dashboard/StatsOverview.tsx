interface StatsOverviewProps {
  winCount: number;
  lossCount: number;
  winRate: number;
  totalPnl: number;
  currentStreak: { type: "win" | "loss" | "none"; count: number };
}

export default function StatsOverview({
  winCount,
  lossCount,
  winRate,
  totalPnl,
  currentStreak,
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-sm text-slate-500">Win / Loss</p>
        <p className="text-xl font-bold text-slate-100 mt-1">
          <span className="text-emerald-400">{winCount}</span>
          <span className="text-slate-600 mx-1">/</span>
          <span className="text-rose-400">{lossCount}</span>
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-sm text-slate-500">Win Rate</p>
        <p
          className={`text-xl font-bold mt-1 ${
            winRate >= 50 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {winRate.toFixed(1)}%
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-sm text-slate-500">Total P&L</p>
        <p
          className={`text-xl font-bold mt-1 ${
            totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-sm text-slate-500">Current Streak</p>
        <p
          className={`text-xl font-bold mt-1 ${
            currentStreak.type === "win"
              ? "text-emerald-400"
              : currentStreak.type === "loss"
              ? "text-rose-400"
              : "text-slate-400"
          }`}
        >
          {currentStreak.count === 0
            ? "—"
            : `${currentStreak.count} ${currentStreak.type === "win" ? "W" : "L"}`}
        </p>
      </div>
    </div>
  );
}
