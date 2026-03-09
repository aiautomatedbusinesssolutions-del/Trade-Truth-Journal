export type ProcessRating = "good" | "bad";
export type OutcomeRating = "win" | "loss";
export type MatrixLabel = "textbook" | "lucky" | "right_process" | "learning";

export interface TradeAnalysis {
  id: string;
  user_id: string;
  trade_id: string;
  technical_summary: string | null;
  psychology_summary: string | null;
  process_rating: ProcessRating | null;
  outcome_rating: OutcomeRating | null;
  matrix_label: MatrixLabel | null;
  matrix_message: string | null;
  raw_response: Record<string, unknown> | null;
  created_at: string;
}

export interface GeminiAnalysisResponse {
  technical_summary: string;
  psychology_summary: string;
  process_rating: ProcessRating;
  matrix_message: string;
}

export interface PatternAnalysis {
  id: string;
  user_id: string;
  emotion_patterns: EmotionPattern[];
  behavior_patterns: BehaviorPattern[];
  source_performance: SourcePerformance[];
  psychology_score: number;
  recommendations: string;
  created_at: string;
}

export interface EmotionPattern {
  pattern: string;
  impact: "positive" | "negative" | "neutral";
  frequency: string;
}

export interface BehaviorPattern {
  behavior: string;
  outcome: string;
  suggestion: string;
}

export interface SourcePerformance {
  source: string;
  win_rate: number;
  avg_pnl: number;
  trade_count: number;
}

export interface GeminiPatternResponse {
  emotion_patterns: EmotionPattern[];
  behavior_patterns: BehaviorPattern[];
  source_performance: SourcePerformance[];
  psychology_score: number;
  recommendations: string;
}
