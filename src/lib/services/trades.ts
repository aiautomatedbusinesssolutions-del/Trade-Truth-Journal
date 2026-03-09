import { createClient } from "@/lib/supabase/client";
import type { TradeEntryData, TradeExitData } from "@/types/database";
import { calculatePnl } from "@/lib/utils/calculations";

export async function createTrade(data: TradeEntryData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Runtime validation
  if (!data.coin_id.trim()) throw new Error("Coin ID is required");
  if (!data.coin_name.trim()) throw new Error("Coin name is required");
  if (!data.coin_symbol.trim()) throw new Error("Coin symbol is required");
  if (!data.entry_reasoning.trim()) throw new Error("Entry reasoning is required");
  if (!data.entry_goal.trim()) throw new Error("Entry goal is required");
  if (!data.checklist_id.trim()) throw new Error("Checklist ID is required");

  if (isNaN(data.entry_price) || data.entry_price <= 0)
    throw new Error("Entry price must be a positive number");
  if (isNaN(data.position_size) || data.position_size <= 0)
    throw new Error("Position size must be a positive number");
  if (data.stop_loss !== null && (isNaN(data.stop_loss) || data.stop_loss <= 0))
    throw new Error("Stop loss must be a positive number");
  if (data.take_profit !== null && (isNaN(data.take_profit) || data.take_profit <= 0))
    throw new Error("Take profit must be a positive number");

  if (data.entry_mood < 1 || data.entry_mood > 5)
    throw new Error("Mood must be between 1 and 5");
  if (data.entry_energy < 1 || data.entry_energy > 5)
    throw new Error("Energy must be between 1 and 5");
  if (data.entry_confidence < 1 || data.entry_confidence > 5)
    throw new Error("Confidence must be between 1 and 5");

  const { data: trade, error } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
      coin_id: data.coin_id,
      coin_name: data.coin_name,
      coin_symbol: data.coin_symbol,
      trade_type: data.trade_type,
      entry_price: data.entry_price,
      position_size: data.position_size,
      stop_loss: data.stop_loss,
      take_profit: data.take_profit,
      idea_source: data.idea_source,
      entry_mood: data.entry_mood,
      entry_energy: data.entry_energy,
      entry_confidence: data.entry_confidence,
      entry_reasoning: data.entry_reasoning,
      entry_goal: data.entry_goal,
      external_pressure: data.external_pressure,
      checklist_id: data.checklist_id,
      status: "open",
    })
    .select()
    .single();

  if (error) throw error;
  return trade;
}

export async function closeTrade(tradeId: string, exitData: TradeExitData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Validate exit data
  if (isNaN(exitData.exit_price) || exitData.exit_price <= 0)
    throw new Error("Exit price must be a positive number");
  if (!exitData.exit_reason.trim())
    throw new Error("Exit reason is required");
  if (exitData.exit_mood < 1 || exitData.exit_mood > 5)
    throw new Error("Mood must be between 1 and 5");
  if (exitData.exit_energy < 1 || exitData.exit_energy > 5)
    throw new Error("Energy must be between 1 and 5");
  if (exitData.exit_confidence < 1 || exitData.exit_confidence > 5)
    throw new Error("Confidence must be between 1 and 5");

  // Fetch the existing trade to calculate P&L
  const { data: existingTrade, error: fetchError } = await supabase
    .from("trades")
    .select("entry_price, position_size, trade_type, status")
    .eq("id", tradeId)
    .single();

  if (fetchError || !existingTrade) throw new Error("Trade not found");
  if (existingTrade.status === "closed") throw new Error("Trade is already closed");

  const { pnlAmount, pnlPercent, isWin } = calculatePnl(
    Number(existingTrade.entry_price),
    exitData.exit_price,
    Number(existingTrade.position_size),
    existingTrade.trade_type as "long" | "short"
  );

  const now = new Date();

  // Atomic update — only update if still open to prevent double-close race
  const { data: updatedTrade, error: updateError } = await supabase
    .from("trades")
    .update({
      exit_price: exitData.exit_price,
      exit_date: now.toISOString(),
      exit_reason: exitData.exit_reason,
      exit_mood: exitData.exit_mood,
      exit_energy: exitData.exit_energy,
      exit_confidence: exitData.exit_confidence,
      pnl_amount: pnlAmount,
      pnl_percent: pnlPercent,
      is_win: isWin,
      status: "closed",
    })
    .eq("id", tradeId)
    .eq("status", "open")
    .select()
    .single();

  if (updateError) {
    if (updateError.code === "PGRST116") {
      throw new Error("Trade is already closed or was not found");
    }
    throw updateError;
  }

  // Create hindsight check rows
  const hindsightChecks = [
    { check_type: "24h", check_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() },
    { check_type: "7d", check_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    { check_type: "30d", check_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  ].map((check) => ({
    user_id: user.id,
    trade_id: tradeId,
    ...check,
    is_completed: false,
  }));

  const { error: hindsightError } = await supabase
    .from("hindsight_checks")
    .insert(hindsightChecks);

  if (hindsightError) throw hindsightError;

  return updatedTrade;
}
