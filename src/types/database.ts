export interface ChecklistEntry {
  id: string;
  user_id: string;
  higher_timeframes: boolean;
  news_check: boolean;
  calm_check: boolean;
  stop_loss_set: boolean;
  in_trading_plan: boolean;
  rr_defined: boolean;
  position_sized: boolean;
  all_passed: boolean;
  created_at: string;
}

export type ChecklistField = Exclude<keyof ChecklistEntry, "id" | "user_id" | "all_passed" | "created_at">;

export type TradeType = "long" | "short";
export type IdeaSource = "own_analysis" | "social_media" | "friend_tip" | "news" | "other";
export type ExternalPressure = "fomo" | "revenge" | "boredom" | "tip" | "none";
export type TradeStatus = "open" | "closed";

export interface Trade {
  id: string;
  user_id: string;
  coin_id: string;
  coin_name: string;
  coin_symbol: string;
  trade_type: TradeType;
  entry_price: number;
  position_size: number;
  stop_loss: number | null;
  take_profit: number | null;
  idea_source: IdeaSource;
  entry_mood: number;
  entry_energy: number;
  entry_confidence: number;
  entry_reasoning: string;
  entry_goal: string;
  external_pressure: ExternalPressure;
  exit_price: number | null;
  exit_date: string | null;
  exit_reason: string | null;
  exit_mood: number | null;
  exit_energy: number | null;
  exit_confidence: number | null;
  pnl_amount: number | null;
  pnl_percent: number | null;
  is_win: boolean | null;
  status: TradeStatus;
  checklist_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradeEntryData {
  coin_id: string;
  coin_name: string;
  coin_symbol: string;
  trade_type: TradeType;
  entry_price: number;
  position_size: number;
  stop_loss: number | null;
  take_profit: number | null;
  idea_source: IdeaSource;
  entry_mood: number;
  entry_energy: number;
  entry_confidence: number;
  entry_reasoning: string;
  entry_goal: string;
  external_pressure: ExternalPressure;
  checklist_id: string;
}

export interface TradeExitData {
  exit_price: number;
  exit_reason: string;
  exit_mood: number;
  exit_energy: number;
  exit_confidence: number;
}

export interface HindsightCheck {
  id: string;
  user_id: string;
  trade_id: string;
  check_type: "24h" | "7d" | "30d";
  check_date: string;
  price_at_check: number | null;
  price_change_percent: number | null;
  is_completed: boolean;
  created_at: string;
}
