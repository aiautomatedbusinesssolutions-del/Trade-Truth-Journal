import Link from "next/link";

interface RecentTrade {
  id: string;
  coin_name: string;
  coin_symbol: string;
  trade_type: "long" | "short";
  status: string;
  pnl_percent: number | null;
  is_win: boolean | null;
  created_at: string;
}

interface RecentTradesProps {
  trades: RecentTrade[];
}

export default function RecentTrades({ trades }: RecentTradesProps) {
  if (trades.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Recent Trades
        </h2>
        <p className="text-slate-400 text-sm">
          No trades yet. Start by logging your first trade.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Recent Trades
        </h2>
        <Link
          href="/trade/history"
          className="text-xs text-sky-400 hover:text-sky-300"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {trades.map((trade) => (
          <Link
            key={trade.id}
            href={`/trade/${trade.id}`}
            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  trade.status === "open"
                    ? "bg-sky-400"
                    : trade.is_win
                    ? "bg-emerald-400"
                    : "bg-rose-400"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-slate-100">
                  {trade.coin_name}
                  <span className="text-slate-500 ml-1.5 uppercase text-xs">
                    {trade.coin_symbol}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  {trade.trade_type === "long" ? "Long" : trade.trade_type === "short" ? "Short" : trade.trade_type} ·{" "}
                  {new Date(trade.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="text-right">
              {trade.status === "closed" && trade.pnl_percent !== null ? (
                <p
                  className={`text-sm font-medium ${
                    trade.is_win ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {trade.is_win ? "+" : ""}
                  {Number(trade.pnl_percent).toFixed(2)}%
                </p>
              ) : (
                <span className="text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                  Open
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
