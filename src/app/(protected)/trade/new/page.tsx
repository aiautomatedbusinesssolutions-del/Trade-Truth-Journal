import PreTradeChecklist from "@/components/trade/PreTradeChecklist";
import TradeEntryForm from "@/components/trade/TradeEntryForm";

export default async function NewTradePage({
  searchParams,
}: {
  searchParams: Promise<{ checklist?: string }>;
}) {
  const { checklist } = await searchParams;

  if (checklist) {
    return <TradeEntryForm checklistId={checklist} />;
  }

  return <PreTradeChecklist />;
}
