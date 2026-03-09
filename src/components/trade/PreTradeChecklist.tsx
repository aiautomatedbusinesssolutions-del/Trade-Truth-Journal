"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveChecklist } from "@/lib/services/checklist";

const CHECKLIST_ITEMS = [
  {
    key: "higher_timeframes" as const,
    label: "Checked higher timeframes",
    description: "Have you looked at the daily and weekly charts for context?",
  },
  {
    key: "news_check" as const,
    label: "Checked for news events",
    description: "Are there any major announcements or events that could move the price?",
  },
  {
    key: "calm_check" as const,
    label: "Feeling calm and focused",
    description: "Are you in the right headspace to make a good decision?",
  },
  {
    key: "stop_loss_set" as const,
    label: "Stop-loss planned",
    description: "Do you know exactly where you'll exit if you're wrong?",
  },
  {
    key: "in_trading_plan" as const,
    label: "Fits my trading plan",
    description: "Does this trade match your strategy and rules?",
  },
  {
    key: "rr_defined" as const,
    label: "Risk-to-reward defined",
    description: "Is the potential reward worth the risk you're taking?",
  },
  {
    key: "position_sized" as const,
    label: "Position size calculated",
    description: "Have you sized this trade so one loss won't hurt your account?",
  },
];

export default function PreTradeChecklist() {
  const router = useRouter();
  const [checks, setChecks] = useState({
    higher_timeframes: false,
    news_check: false,
    calm_check: false,
    stop_loss_set: false,
    in_trading_plan: false,
    rr_defined: false,
    position_sized: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked = Object.values(checks).every(Boolean);
  const checkedCount = Object.values(checks).filter(Boolean).length;

  const handleToggle = (key: keyof typeof checks) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!allChecked) return;
    setLoading(true);
    setError(null);

    try {
      const entry = await saveChecklist(checks);
      if (!entry?.id) throw new Error("Checklist was not saved correctly");
      router.push(`/trade/new?checklist=${entry.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save checklist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">
        Pre-Trade Checklist
      </h1>
      <p className="text-slate-400 mb-6">
        Complete all 7 items before entering a trade. This keeps you disciplined.
      </p>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">{checkedCount} of 7 complete</span>
          {allChecked && (
            <span className="text-emerald-400">All clear!</span>
          )}
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              allChecked ? "bg-emerald-500" : "bg-sky-500"
            }`}
            style={{ width: `${(checkedCount / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-3 mb-6">
        {CHECKLIST_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleToggle(item.key)}
            className={`w-full text-left bg-slate-900 border rounded-xl p-4 transition-colors ${
              checks[item.key]
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  checks[item.key]
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-slate-600"
                }`}
              >
                {checks[item.key] && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <div>
                <p
                  className={`font-medium ${
                    checks[item.key] ? "text-emerald-400" : "text-slate-100"
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-4">
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!allChecked || loading}
        className={`w-full font-medium py-3 rounded-lg transition-colors ${
          allChecked
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-slate-800 text-slate-500 cursor-not-allowed"
        }`}
      >
        {loading
          ? "Saving..."
          : allChecked
          ? "Continue to Trade Entry"
          : `Complete all items to continue (${7 - checkedCount} remaining)`}
      </button>
    </div>
  );
}
