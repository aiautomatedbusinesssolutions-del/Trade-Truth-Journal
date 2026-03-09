import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import TradeExitForm from "@/components/trade/TradeExitForm";

export default async function TradeExitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trade, error } = await supabase
    .from("trades")
    .select("id, coin_name, coin_symbol, trade_type, entry_price, status")
    .eq("id", id)
    .single();

  if (error || !trade) {
    notFound();
  }

  if (trade.status === "closed") {
    redirect(`/trade/${id}`);
  }

  return (
    <TradeExitForm
      tradeId={trade.id}
      coinName={trade.coin_name}
      coinSymbol={trade.coin_symbol}
      tradeType={trade.trade_type}
      entryPrice={Number(trade.entry_price)}
    />
  );
}
