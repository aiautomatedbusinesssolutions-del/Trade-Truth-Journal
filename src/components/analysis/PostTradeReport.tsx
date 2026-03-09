"use client";

import { useState, useEffect, useRef } from "react";
import { triggerPostTradeAnalysis } from "@/lib/services/analysis";
import ProcessOutcomeMatrix from "@/components/analysis/ProcessOutcomeMatrix";
import type { TradeAnalysis, MatrixLabel } from "@/types/analysis";

interface PostTradeReportProps {
  tradeId: string;
  existingAnalysis: TradeAnalysis | null;
}

export default function PostTradeReport({
  tradeId,
  existingAnalysis,
}: PostTradeReportProps) {
  const [analysis, setAnalysis] = useState<TradeAnalysis | null>(existingAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Auto-trigger if no existing analysis
  useEffect(() => {
    if (existingAnalysis) return;

    let cancelled = false;
    setLoading(true);

    triggerPostTradeAnalysis(tradeId)
      .then((result) => {
        if (!cancelled) setAnalysis(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Analysis failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tradeId, existingAnalysis]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-800 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-slate-800 rounded w-1/2 mx-auto" />
          <p className="text-slate-400 text-sm mt-4">
            Analyzing your trade with AI...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6">
        <p className="text-rose-400 font-medium">Analysis failed</p>
        <p className="text-rose-400/70 text-sm mt-1">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            triggerPostTradeAnalysis(tradeId)
              .then((result) => { if (mountedRef.current) setAnalysis(result); })
              .catch((err) => { if (mountedRef.current) setError(err instanceof Error ? err.message : "Retry failed"); })
              .finally(() => { if (mountedRef.current) setLoading(false); });
          }}
          className="mt-3 text-sm text-sky-400 hover:text-sky-300"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-4">
      {/* Technical Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Trade Analysis
        </h3>
        <p className="text-slate-300">{analysis.technical_summary}</p>
      </div>

      {/* Psychology Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Psychology Review
        </h3>
        <p className="text-slate-300">{analysis.psychology_summary}</p>
      </div>

      {/* Process vs Outcome Matrix */}
      {analysis.matrix_label && analysis.matrix_message && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <ProcessOutcomeMatrix
            activeLabel={analysis.matrix_label as MatrixLabel}
            message={analysis.matrix_message}
          />
        </div>
      )}
    </div>
  );
}
