interface HindsightCheckData {
  id: string;
  check_type: "24h" | "7d" | "30d";
  price_at_check: number | null;
  price_change_percent: number | null;
  is_completed: boolean;
  check_date: string;
}

interface HindsightCardProps {
  checks: HindsightCheckData[];
  exitPrice: number;
}

const CHECK_LABELS: Record<string, string> = {
  "24h": "24 hours later",
  "7d": "7 days later",
  "30d": "30 days later",
};

export default function HindsightCard({ checks, exitPrice }: HindsightCardProps) {
  const completedChecks = checks.filter((c) => c.is_completed);
  const pendingChecks = checks.filter((c) => !c.is_completed);

  if (completedChecks.length === 0 && pendingChecks.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
        Hindsight Check
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        What happened to the price after you exited at ${exitPrice.toLocaleString()}?
      </p>

      <div className="space-y-3">
        {completedChecks.map((check) => {
          const pct = check.price_change_percent;
          const price = check.price_at_check;
          const hasData = pct !== null && price !== null;
          const isUp = hasData && pct > 0;
          return (
            <div
              key={check.id}
              className={`rounded-lg p-3 border ${
                !hasData
                  ? "bg-slate-800/50 border-slate-800"
                  : isUp
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-rose-500/10 border-rose-500/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">
                  {CHECK_LABELS[check.check_type] ?? check.check_type}
                </p>
                {hasData ? (
                  <p
                    className={`text-sm font-medium ${
                      isUp ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isUp ? "+" : ""}
                    {pct.toFixed(2)}%
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">Unavailable</p>
                )}
              </div>
              {hasData ? (
                <p className="text-xs text-slate-500 mt-1">
                  Price was ${price.toLocaleString()}
                </p>
              ) : (
                <p className="text-xs text-slate-600 mt-1">
                  Price data was not available
                </p>
              )}
            </div>
          );
        })}

        {pendingChecks.map((check) => (
          <div
            key={check.id}
            className="rounded-lg p-3 border bg-slate-800/50 border-slate-800"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {CHECK_LABELS[check.check_type] ?? check.check_type}
              </p>
              <p className="text-xs text-slate-600">
                Due {new Date(check.check_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
