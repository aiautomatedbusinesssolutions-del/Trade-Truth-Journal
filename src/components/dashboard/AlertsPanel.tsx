interface AlertsPanelProps {
  lossStreak: number;
  pendingHindsightCount: number;
}

export default function AlertsPanel({
  lossStreak,
  pendingHindsightCount,
}: AlertsPanelProps) {
  const hasAlerts = lossStreak >= 3 || pendingHindsightCount > 0;

  if (!hasAlerts) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
        Alerts
      </h2>

      {lossStreak >= 3 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
          <p className="text-rose-400 font-medium text-sm">
            {lossStreak} losses in a row
          </p>
          <p className="text-rose-400/70 text-xs mt-1">
            Consider taking a break. Revenge trading rarely ends well.
          </p>
        </div>
      )}

      {pendingHindsightCount > 0 && (
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4">
          <p className="text-sky-400 font-medium text-sm">
            {pendingHindsightCount} hindsight check{pendingHindsightCount > 1 ? "s" : ""} ready
          </p>
          <p className="text-sky-400/70 text-xs mt-1">
            See how prices moved after your trades.
          </p>
        </div>
      )}
    </div>
  );
}
