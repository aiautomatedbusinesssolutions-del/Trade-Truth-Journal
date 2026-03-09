"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface HistoryTrade {
  id: string;
  coin_name: string;
  coin_symbol: string;
  trade_type: "long" | "short";
  status: string;
  pnl_percent: number | null;
  pnl_amount: number | null;
  is_win: boolean | null;
  created_at: string;
  exit_date: string | null;
}

interface TradeHistoryListProps {
  trades: HistoryTrade[];
  currentFilter: string;
  currentFrom: string;
  currentTo: string;
}

const FILTERS = [
  { value: "all", label: "All" },
  { value: "win", label: "Wins" },
  { value: "loss", label: "Losses" },
  { value: "open", label: "Open" },
];

export default function TradeHistoryList({
  trades,
  currentFilter,
  currentFrom,
  currentTo,
}: TradeHistoryListProps) {
  const router = useRouter();

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams();
    const merged = {
      filter: currentFilter,
      from: currentFrom,
      to: currentTo,
      ...updates,
    };
    for (const [key, val] of Object.entries(merged)) {
      if (val && val !== "all") params.set(key, val);
    }
    router.push(`/trade/history?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => updateParams({ filter: f.value })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentFilter === f.value || (!currentFilter && f.value === "all")
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <input
            type="date"
            value={currentFrom}
            onChange={(e) => updateParams({ from: e.target.value })}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="date"
            value={currentTo}
            onChange={(e) => updateParams({ to: e.target.value })}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500">{trades.length} trade{trades.length !== 1 ? "s" : ""}</p>

      {/* Trade list */}
      {trades.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
          <p className="text-slate-400 text-sm">No trades match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trades.map((trade) => (
            <Link
              key={trade.id}
              href={`/trade/${trade.id}`}
              className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
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
                  <p className="font-medium text-slate-100">
                    {trade.coin_name}
                    <span className="text-slate-500 ml-1.5 uppercase text-xs">
                      {trade.coin_symbol}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {trade.trade_type === "long" ? "Long" : trade.trade_type === "short" ? "Short" : trade.trade_type} ·{" "}
                    {new Date(trade.created_at).toLocaleDateString()}
                    {trade.exit_date && (
                      <> → {new Date(trade.exit_date).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              </div>

              <div className="text-right">
                {trade.status === "closed" && trade.pnl_percent !== null ? (
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        trade.is_win ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {trade.is_win ? "+" : ""}
                      {Number(trade.pnl_percent).toFixed(2)}%
                    </p>
                    {trade.pnl_amount !== null && (
                      <p
                        className={`text-xs ${
                          trade.is_win ? "text-emerald-400/70" : "text-rose-400/70"
                        }`}
                      >
                        {trade.is_win ? "+" : ""}${Number(trade.pnl_amount).toFixed(2)}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                    Open
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
