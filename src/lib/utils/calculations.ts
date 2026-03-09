export function calculatePnl(
  entryPrice: number,
  exitPrice: number,
  positionSize: number,
  tradeType: "long" | "short"
) {
  const priceDiff =
    tradeType === "long" ? exitPrice - entryPrice : entryPrice - exitPrice;

  if (entryPrice <= 0) throw new Error("Entry price must be greater than zero");

  const pnlPercent = (priceDiff / entryPrice) * 100;
  const pnlAmount = (priceDiff / entryPrice) * positionSize;
  const isWin = pnlAmount > 0;

  return { pnlAmount, pnlPercent, isWin };
}
