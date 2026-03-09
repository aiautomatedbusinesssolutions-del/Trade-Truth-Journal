"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CoinSearch from "@/components/trade/CoinSearch";
import { getCoinPrice } from "@/lib/services/coingecko";
import { createTrade } from "@/lib/services/trades";
import type { CoinSearchResult } from "@/types/coingecko";
import type { TradeType, IdeaSource, ExternalPressure } from "@/types/database";

const MOOD_EMOJIS = ["😰", "😟", "😐", "🙂", "😄"];
const IDEA_SOURCES: { value: IdeaSource; label: string }[] = [
  { value: "own_analysis", label: "My Own Analysis" },
  { value: "social_media", label: "Social Media" },
  { value: "friend_tip", label: "Friend / Tip" },
  { value: "news", label: "News" },
  { value: "other", label: "Other" },
];
const PRESSURES: { value: ExternalPressure; label: string }[] = [
  { value: "none", label: "None — I'm calm" },
  { value: "fomo", label: "FOMO — afraid of missing out" },
  { value: "revenge", label: "Revenge — making up for a loss" },
  { value: "boredom", label: "Boredom — just want action" },
  { value: "tip", label: "Tip — someone told me to" },
];

interface TradeEntryFormProps {
  checklistId: string;
}

function validateOptionalNumber(value: string, label: string): number {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive number`);
  }
  return parsed;
}

export default function TradeEntryForm({ checklistId }: TradeEntryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coin selection
  const [selectedCoin, setSelectedCoin] = useState<CoinSearchResult | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);

  // Technical fields
  const [tradeType, setTradeType] = useState<TradeType>("long");
  const [entryPrice, setEntryPrice] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [ideaSource, setIdeaSource] = useState<IdeaSource>("own_analysis");

  // Psychology fields
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [confidence, setConfidence] = useState(3);
  const [reasoning, setReasoning] = useState("");
  const [goal, setGoal] = useState("");
  const [pressure, setPressure] = useState<ExternalPressure>("none");

  // Fetch live price when coin is selected
  useEffect(() => {
    if (!selectedCoin) {
      setLivePrice(null);
      return;
    }
    let cancelled = false;
    getCoinPrice(selectedCoin.id).then((price) => {
      if (!cancelled) {
        setLivePrice(price);
        if (price !== null && !entryPrice) {
          setEntryPrice(String(price));
        }
      }
    });
    return () => { cancelled = true; };
  }, [selectedCoin]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoin) return;

    const parsedEntry = parseFloat(entryPrice);
    const parsedSize = parseFloat(positionSize);
    if (isNaN(parsedEntry) || parsedEntry <= 0) {
      setError("Entry price must be a positive number");
      return;
    }
    if (isNaN(parsedSize) || parsedSize <= 0) {
      setError("Position size must be a positive number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const trade = await createTrade({
        coin_id: selectedCoin.id,
        coin_name: selectedCoin.name,
        coin_symbol: selectedCoin.symbol,
        trade_type: tradeType,
        entry_price: parsedEntry,
        position_size: parsedSize,
        stop_loss: stopLoss ? validateOptionalNumber(stopLoss, "Stop loss") : null,
        take_profit: takeProfit ? validateOptionalNumber(takeProfit, "Take profit") : null,
        idea_source: ideaSource,
        entry_mood: mood,
        entry_energy: energy,
        entry_confidence: confidence,
        entry_reasoning: reasoning,
        entry_goal: goal,
        external_pressure: pressure,
        checklist_id: checklistId,
      });

      if (!trade?.id) throw new Error("Trade was not saved correctly");
      router.push(`/trade/${trade.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Log New Trade
        </h1>
        <p className="text-slate-400">
          Record what you're trading and how you're feeling.
        </p>
      </div>

      {/* === COIN SELECTION === */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">Coin</h2>
        <CoinSearch onSelect={setSelectedCoin} selected={selectedCoin} />
        {livePrice !== null && (
          <p className="text-sm text-slate-400">
            Current price: <span className="text-sky-400">${livePrice.toLocaleString()}</span>
          </p>
        )}
      </section>

      {/* === TRADE DETAILS === */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Trade Details</h2>

        {/* Trade Type */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Direction</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTradeType("long")}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                tradeType === "long"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              Long (Buy)
            </button>
            <button
              type="button"
              onClick={() => setTradeType("short")}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                tradeType === "short"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              Short (Sell)
            </button>
          </div>
        </div>

        {/* Price fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Entry Price *
            </label>
            <input
              type="number"
              step="any"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Position Size *
            </label>
            <input
              type="number"
              step="any"
              value={positionSize}
              onChange={(e) => setPositionSize(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="$0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Stop Loss
            </label>
            <input
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Take Profit
            </label>
            <input
              type="number"
              step="any"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Idea Source */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Where did this idea come from?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {IDEA_SOURCES.map((src) => (
              <button
                key={src.value}
                type="button"
                onClick={() => setIdeaSource(src.value)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  ideaSource === src.value
                    ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* === PSYCHOLOGY === */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-slate-100">
          How are you feeling?
        </h2>

        {/* Mood */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Mood right now
          </label>
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
            <span>Exhausted</span>
            <span>Energized</span>
          </div>
        </div>

        {/* Confidence */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Confidence in this trade: {confidence}/5
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

        {/* Reasoning */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Why are you taking this trade? *
          </label>
          <textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            required
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            placeholder="What's your thesis? What setup do you see?"
          />
        </div>

        {/* Goal */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            What's your goal for this trade? *
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
            rows={2}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            placeholder="e.g. Quick scalp, swing to resistance, hold for breakout"
          />
        </div>

        {/* External Pressure */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Any external pressure?
          </label>
          <div className="space-y-2">
            {PRESSURES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPressure(p.value)}
                className={`w-full text-left py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                  pressure === p.value
                    ? p.value === "none"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* === ERROR & SUBMIT === */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !selectedCoin}
        className={`w-full font-medium py-3 rounded-lg transition-colors ${
          selectedCoin
            ? "bg-sky-600 hover:bg-sky-700 text-white"
            : "bg-slate-800 text-slate-500 cursor-not-allowed"
        }`}
      >
        {loading ? "Saving trade..." : "Open Trade"}
      </button>
    </form>
  );
}
