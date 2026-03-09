import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import PostTradeReport from "@/components/analysis/PostTradeReport";

export default async function TradeAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .select("id, coin_name, coin_symbol, status, is_win, pnl_percent")
    .eq("id", id)
    .single();

  if (tradeError || !trade) {
    notFound();
  }

  if (trade.status !== "closed") {
    redirect(`/trade/${id}`);
  }

  // Check for existing analysis
  const { data: existingAnalysis } = await supabase
    .from("trade_analyses")
    .select("*")
    .eq("trade_id", id)
    .single();

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Trade Analysis
          </h1>
          <p className="text-slate-400">
            {trade.coin_name}{" "}
            <span className="uppercase">{trade.coin_symbol}</span>
            {trade.pnl_percent !== null && (
              <span
                className={`ml-2 ${
                  trade.is_win ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {trade.is_win ? "+" : ""}
                {Number(trade.pnl_percent).toFixed(2)}%
              </span>
            )}
          </p>
        </div>
        <Link
          href={`/trade/${id}`}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          View Trade
        </Link>
      </div>

      <PostTradeReport
        tradeId={id}
        existingAnalysis={existingAnalysis ?? null}
      />
    </div>
  );
}
