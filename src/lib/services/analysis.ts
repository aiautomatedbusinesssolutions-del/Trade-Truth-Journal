import type { TradeAnalysis } from "@/types/analysis";

export async function triggerPostTradeAnalysis(tradeId: string): Promise<TradeAnalysis> {
  const res = await fetch("/api/analysis/post-trade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tradeId }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to generate analysis");
  }

  return data.analysis;
}
