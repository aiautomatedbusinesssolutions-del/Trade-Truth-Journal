import { createClient } from "@/lib/supabase/server";
import TradeHistoryList from "@/components/trade/TradeHistoryList";

export default async function TradeHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; from?: string; to?: string }>;
}) {
  const { filter, from, to } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("trades")
    .select("id, coin_name, coin_symbol, trade_type, status, pnl_percent, pnl_amount, is_win, created_at, exit_date")
    .order("created_at", { ascending: false });

  // Apply filters
  if (filter === "win") {
    query = query.eq("is_win", true);
  } else if (filter === "loss") {
    query = query.eq("is_win", false);
  } else if (filter === "open") {
    query = query.eq("status", "open");
  }

  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      query = query.gte("created_at", fromDate.toISOString());
    }
  }
  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      // Add 1 day to include the full "to" date
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt("created_at", toDate.toISOString());
    }
  }

  const { data: trades } = await query;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Trade History</h1>
      <TradeHistoryList
        trades={trades ?? []}
        currentFilter={filter ?? "all"}
        currentFrom={from ?? ""}
        currentTo={to ?? ""}
      />
    </div>
  );
}
