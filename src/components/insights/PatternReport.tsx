"use client";

import { useState, useRef, useEffect } from "react";
import type {
  PatternAnalysis,
  EmotionPattern,
  BehaviorPattern,
  SourcePerformance,
} from "@/types/analysis";

interface PatternReportProps {
  existingAnalysis: PatternAnalysis | null;
  closedTradeCount: number;
}

export default function PatternReport({
  existingAnalysis,
  closedTradeCount,
}: PatternReportProps) {
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(existingAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const canGenerate = closedTradeCount >= 10;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analysis/patterns", { method: "POST" });
      const data = await res.json();

      if (!mountedRef.current) return;

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate analysis");
      }

      setAnalysis(data.analysis);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Analysis failed");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  if (!canGenerate && !analysis) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <p className="text-2xl mb-3">&#128202;</p>
        <h2 className="text-lg font-bold text-slate-100 mb-2">
          Pattern Analysis Locked
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          You need at least 10 closed trades for deep pattern analysis.
          You currently have {closedTradeCount}.
        </p>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden max-w-xs mx-auto">
          <div
            className="h-full bg-sky-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, (closedTradeCount / 10) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {10 - closedTradeCount} more trades to go
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400 mb-4">
            Ready to analyze {closedTradeCount} trades for deep patterns.
          </p>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-4">
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Analyzing trades..." : "Generate Pattern Analysis"}
          </button>

          {loading && (
            <p className="text-slate-500 text-xs mt-3">
              This may take a moment — analyzing all your trades with AI...
            </p>
          )}
        </div>
      </div>
    );
  }

  const emotionPatterns = (analysis.emotion_patterns ?? []) as EmotionPattern[];
  const behaviorPatterns = (analysis.behavior_patterns ?? []) as BehaviorPattern[];
  const sourcePerf = (analysis.source_performance ?? []) as SourcePerformance[];
  const score = analysis.psychology_score;

  const scoreColor =
    score >= 80
      ? "text-emerald-400"
      : score >= 60
      ? "text-sky-400"
      : score >= 40
      ? "text-amber-400"
      : "text-rose-400";

  return (
    <div className="space-y-6">
      {/* Psychology Score */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Psychology Score
        </h3>
        <p className={`text-5xl font-bold ${scoreColor}`}>{score}</p>
        <p className="text-slate-400 text-sm mt-2">
          {score >= 80
            ? "Excellent discipline"
            : score >= 60
            ? "Good — room to improve"
            : score >= 40
            ? "Needs work"
            : "Needs attention"}
        </p>
      </div>

      {/* Emotion Patterns */}
      {emotionPatterns.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Emotion Patterns
          </h3>
          <div className="space-y-3">
            {emotionPatterns.map((ep, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 border ${
                  ep.impact === "positive"
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : ep.impact === "negative"
                    ? "bg-rose-500/10 border-rose-500/20"
                    : "bg-slate-800/50 border-slate-800"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    ep.impact === "positive"
                      ? "text-emerald-400"
                      : ep.impact === "negative"
                      ? "text-rose-400"
                      : "text-slate-300"
                  }`}
                >
                  {ep.pattern}
                </p>
                <p className="text-xs text-slate-500 mt-1">{ep.frequency}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Behavior Patterns */}
      {behaviorPatterns.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Behavior Patterns
          </h3>
          <div className="space-y-3">
            {behaviorPatterns.map((bp, i) => (
              <div
                key={i}
                className="bg-slate-800/50 border border-slate-800 rounded-lg p-4"
              >
                <p className="text-sm font-medium text-slate-100">
                  {bp.behavior}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Outcome: {bp.outcome}
                </p>
                <p className="text-xs text-sky-400 mt-2">
                  Suggestion: {bp.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source Performance */}
      {sourcePerf.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Idea Source Rankings
          </h3>
          <div className="space-y-2">
            {sourcePerf.map((sp, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    {sp.source}
                  </p>
                  <p className="text-xs text-slate-500">
                    {sp.trade_count} trade{sp.trade_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      sp.win_rate >= 50 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {sp.win_rate.toFixed(0)}% win rate
                  </p>
                  <p
                    className={`text-xs ${
                      sp.avg_pnl >= 0 ? "text-emerald-400/70" : "text-rose-400/70"
                    }`}
                  >
                    avg {sp.avg_pnl >= 0 ? "+" : ""}
                    {sp.avg_pnl.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Recommendations
          </h3>
          <div className="text-slate-300 text-sm whitespace-pre-line">
            {analysis.recommendations}
          </div>
        </div>
      )}

      {/* Regenerate button */}
      <div className="text-center">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="text-sm text-slate-500 hover:text-slate-300 disabled:opacity-50 transition-colors"
        >
          {loading ? "Regenerating..." : "Regenerate analysis with latest trades"}
        </button>
      </div>
    </div>
  );
}
