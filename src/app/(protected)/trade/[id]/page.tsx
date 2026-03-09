import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import HindsightCard from "@/components/analysis/HindsightCard";

const MOOD_EMOJIS = ["😰", "😟", "😐", "🙂", "😄"];

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trade, error } = await supabase
    .from("trades")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !trade) {
    notFound();
  }

  const isClosed = trade.status === "closed";

  // Fetch hindsight checks for closed trades
  let hindsightChecks: { id: string; check_type: "24h" | "7d" | "30d"; price_at_check: number | null; price_change_percent: number | null; is_completed: boolean; check_date: string }[] = [];
  if (isClosed) {
    const { data } = await supabase
      .from("hindsight_checks")
      .select("id, check_type, price_at_check, price_change_percent, is_completed, check_date")
      .eq("trade_id", id)
      .order("check_date", { ascending: true });
    hindsightChecks = (data ?? []) as typeof hindsightChecks;
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">
        {trade.coin_name}
        <span className="text-slate-400 ml-2 text-lg uppercase">
          {trade.coin_symbol}
        </span>
      </h1>
      <p className="text-slate-400 mb-6">
        {trade.trade_type === "long" ? "Long" : "Short"} — Status:{" "}
        <span
          className={
            isClosed ? "text-slate-300" : "text-emerald-400"
          }
        >
          {trade.status}
        </span>
      </p>

      {/* P&L Banner (closed trades) */}
      {isClosed && trade.pnl_percent !== null && (
        <div
          className={`rounded-xl p-5 border mb-6 ${
            trade.is_win
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-rose-500/10 border-rose-500/20"
          }`}
        >
          <p className="text-sm text-slate-400 mb-1">Result</p>
          <p
            className={`text-3xl font-bold ${
              trade.is_win ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trade.is_win ? "+" : ""}
            {Number(trade.pnl_percent).toFixed(2)}%
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {trade.is_win ? "+" : ""}${Number(trade.pnl_amount).toFixed(2)}
          </p>
        </div>
      )}

      {/* Entry Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Entry
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-500">Entry Price</p>
            <p className="text-slate-100 font-medium">
              ${Number(trade.entry_price).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Position Size</p>
            <p className="text-slate-100 font-medium">
              ${Number(trade.position_size).toLocaleString()}
            </p>
          </div>
          {trade.stop_loss && (
            <div>
              <p className="text-sm text-slate-500">Stop Loss</p>
              <p className="text-rose-400 font-medium">
                ${Number(trade.stop_loss).toLocaleString()}
              </p>
            </div>
          )}
          {trade.take_profit && (
            <div>
              <p className="text-sm text-slate-500">Take Profit</p>
              <p className="text-emerald-400 font-medium">
                ${Number(trade.take_profit).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <hr className="border-slate-800" />

        <div>
          <p className="text-sm text-slate-500">Reasoning</p>
          <p className="text-slate-300 mt-1">{trade.entry_reasoning}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Goal</p>
          <p className="text-slate-300 mt-1">{trade.entry_goal}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-500">Mood</p>
            <p className="text-xl">{MOOD_EMOJIS[trade.entry_mood - 1]}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Energy</p>
            <p className="text-slate-100">{trade.entry_energy}/5</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Confidence</p>
            <p className="text-slate-100">{trade.entry_confidence}/5</p>
          </div>
        </div>
      </div>

      {/* Exit Details (closed trades) */}
      {isClosed && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 mt-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Exit
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Exit Price</p>
              <p className="text-slate-100 font-medium">
                ${Number(trade.exit_price).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Exit Date</p>
              <p className="text-slate-100 font-medium">
                {trade.exit_date ? new Date(trade.exit_date).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500">Exit Reason</p>
            <p className="text-slate-300 mt-1">{trade.exit_reason}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-500">Mood</p>
              <p className="text-xl">{MOOD_EMOJIS[(trade.exit_mood ?? 3) - 1]}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Energy</p>
              <p className="text-slate-100">{trade.exit_energy ?? "—"}/5</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Confidence</p>
              <p className="text-slate-100">{trade.exit_confidence ?? "—"}/5</p>
            </div>
          </div>
        </div>
      )}

      {/* Close Trade Button (open trades) */}
      {!isClosed && (
        <Link
          href={`/trade/${trade.id}/exit`}
          className="block text-center bg-rose-600 hover:bg-rose-700 text-white font-medium py-3 rounded-lg transition-colors mt-6"
        >
          Close Trade
        </Link>
      )}

      {/* Hindsight Checks (closed trades) */}
      {isClosed && hindsightChecks.length > 0 && (
        <div className="mt-4">
          <HindsightCard
            checks={hindsightChecks}
            exitPrice={Number(trade.exit_price)}
          />
        </div>
      )}

      {/* View Analysis (closed trades) */}
      {isClosed && (
        <Link
          href={`/trade/${trade.id}/analysis`}
          className="block text-center bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 rounded-lg transition-colors mt-6"
        >
          View AI Analysis
        </Link>
      )}
    </div>
  );
}
