"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { closeTrade } from "@/lib/services/trades";

const MOOD_EMOJIS = ["😰", "😟", "😐", "🙂", "😄"];
const EXIT_REASONS = [
  "Hit take profit",
  "Hit stop loss",
  "Manual close — thesis changed",
  "Manual close — taking profits early",
  "Manual close — cutting losses early",
  "Liquidated",
  "Other",
];

interface TradeExitFormProps {
  tradeId: string;
  coinName: string;
  coinSymbol: string;
  tradeType: "long" | "short";
  entryPrice: number;
}

export default function TradeExitForm({
  tradeId,
  coinName,
  coinSymbol,
  tradeType,
  entryPrice,
}: TradeExitFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [exitPrice, setExitPrice] = useState("");
  const [exitReason, setExitReason] = useState("");
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [confidence, setConfidence] = useState(3);

  // Live P&L preview
  const parsedExit = parseFloat(exitPrice);
  const hasValidExit = !isNaN(parsedExit) && parsedExit > 0;
  let previewPnlPercent = 0;
  let previewIsWin = false;
  if (hasValidExit && entryPrice > 0) {
    const diff =
      tradeType === "long"
        ? parsedExit - entryPrice
        : entryPrice - parsedExit;
    previewPnlPercent = (diff / entryPrice) * 100;
    previewIsWin = diff > 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValidExit) {
      setError("Exit price must be a positive number");
      return;
    }
    if (!exitReason.trim()) {
      setError("Please select an exit reason");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await closeTrade(tradeId, {
        exit_price: parsedExit,
        exit_reason: exitReason,
        exit_mood: mood,
        exit_energy: energy,
        exit_confidence: confidence,
      });
      router.push(`/trade/${tradeId}/analysis`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close trade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Close Trade
        </h1>
        <p className="text-slate-400">
          {coinName}{" "}
          <span className="uppercase">{coinSymbol}</span> —{" "}
          {tradeType === "long" ? "Long" : "Short"} @ $
          {entryPrice.toLocaleString()}
        </p>
      </div>

      {/* Exit Price */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">Exit Price</h2>
        <input
          type="number"
          step="any"
          value={exitPrice}
          onChange={(e) => setExitPrice(e.target.value)}
          required
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="0.00"
        />

        {/* P&L Preview */}
        {hasValidExit && (
          <div
            className={`rounded-xl p-4 border ${
              previewIsWin
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-rose-500/10 border-rose-500/20"
            }`}
          >
            <p className="text-sm text-slate-400 mb-1">Estimated P&L</p>
            <p
              className={`text-2xl font-bold ${
                previewIsWin ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {previewIsWin ? "+" : ""}
              {previewPnlPercent.toFixed(2)}%
            </p>
          </div>
        )}
      </section>

      {/* Exit Reason */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">
          Why are you closing?
        </h2>
        <div className="space-y-2">
          {EXIT_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setExitReason(reason)}
              className={`w-full text-left py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                exitReason === reason
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {reason}
            </button>
          ))}
        </div>
      </section>

      {/* Psychology at Exit */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-slate-100">
          How are you feeling now?
        </h2>

        {/* Mood */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Mood</label>
          <div className="flex gap-2">
            {MOOD_EMOJIS.map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMood(i + 1)}
                className={`flex-1 py-3 text-2xl rounded-lg transition-all ${
                  mood === i + 1
                    ? "bg-sky-500/20 border border-sky-500/30 scale-110"
                    : "bg-slate-800 border border-slate-700"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Energy */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Energy level: {energy}/5
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full accent-sky-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Drained</span>
            <span>Energized</span>
          </div>
        </div>

        {/* Confidence */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            How confident do you feel about this exit? {confidence}/5
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setConfidence(n)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  confidence === n
                    ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Error & Submit */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
      >
        {loading ? "Closing trade..." : "Close Trade"}
      </button>
    </form>
  );
}
