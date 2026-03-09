"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/ui/Modal";

type AlertType = "loss_streak" | "inactivity" | null;

export default function AlertChecker() {
  const [alertType, setAlertType] = useState<AlertType>(null);
  const [lossCount, setLossCount] = useState(0);
  const [daysSinceLastTrade, setDaysSinceLastTrade] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function checkAlerts() {
      const supabase = createClient();

      // Check for consecutive losses (most recent closed trades)
      const { data: recentTrades, error: streakError } = await supabase
        .from("trades")
        .select("is_win")
        .eq("status", "closed")
        .order("created_at", { ascending: false })
        .limit(10);

      if (cancelled) return;
      if (streakError) return;

      if (recentTrades && recentTrades.length > 0) {
        let streak = 0;
        for (const trade of recentTrades) {
          if (trade.is_win === false) {
            streak++;
          } else {
            break;
          }
        }

        if (streak >= 3) {
          setLossCount(streak);
          setAlertType("loss_streak");
          return;
        }
      }

      // Check for inactivity (7+ days since last trade)
      const { data: lastTrade, error: inactivityError } = await supabase
        .from("trades")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (cancelled) return;
      if (inactivityError) return;

      if (lastTrade) {
        const lastTradeDate = new Date(lastTrade.created_at);
        const now = new Date();
        const diffDays = Math.floor(
          (now.getTime() - lastTradeDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays >= 7) {
          setDaysSinceLastTrade(diffDays);
          setAlertType("inactivity");
        }
      }
    }

    checkAlerts();
    return () => { cancelled = true; };
  }, []);

  const handleClose = useCallback(() => setAlertType(null), []);

  return (
    <>
      {/* Loss Streak Modal */}
      <Modal isOpen={alertType === "loss_streak"} onClose={handleClose}>
        <div className="text-center">
          <div className="text-4xl mb-4">
            <span role="img" aria-label="warning">&#9888;&#65039;</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">
            {lossCount} Losses in a Row
          </h2>
          <p className="text-slate-400 mb-4">
            Hey, losing streaks happen to everyone. But trading while frustrated
            often leads to revenge trades — and more losses.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
            <p className="text-amber-400 text-sm font-medium mb-1">
              Consider taking a break
            </p>
            <p className="text-amber-400/70 text-xs">
              Step away, review your journal, and come back with a clear head.
              Your capital will still be here tomorrow.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium py-2.5 rounded-lg transition-colors"
          >
            I understand
          </button>
        </div>
      </Modal>

      {/* Inactivity Nudge Modal */}
      <Modal isOpen={alertType === "inactivity"} onClose={handleClose}>
        <div className="text-center">
          <div className="text-4xl mb-4">
            <span role="img" aria-label="wave">&#128075;</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">
            Welcome Back!
          </h2>
          <p className="text-slate-400 mb-4">
            It&apos;s been {daysSinceLastTrade} days since your last trade.
            Your journal is ready when you are.
          </p>
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-4 mb-6">
            <p className="text-sky-400 text-sm font-medium mb-1">
              Consistency builds insight
            </p>
            <p className="text-sky-400/70 text-xs">
              The more trades you journal, the clearer your patterns become.
              Even small trades count.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Let&apos;s go
          </button>
        </div>
      </Modal>
    </>
  );
}
