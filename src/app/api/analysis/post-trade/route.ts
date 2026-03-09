import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { callGemini } from "@/lib/services/gemini";
import type { GeminiAnalysisResponse, MatrixLabel } from "@/types/analysis";

function getMatrixLabel(
  processRating: "good" | "bad",
  isWin: boolean
): MatrixLabel {
  if (isWin && processRating === "good") return "textbook";
  if (isWin && processRating === "bad") return "lucky";
  if (!isWin && processRating === "good") return "right_process";
  return "learning";
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component context
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const tradeId = (body as Record<string, unknown>)?.tradeId;

  if (!tradeId || typeof tradeId !== "string") {
    return NextResponse.json({ error: "Missing or invalid tradeId" }, { status: 400 });
  }

  // Check if analysis already exists
  const { data: existing } = await supabase
    .from("trade_analyses")
    .select("id")
    .eq("trade_id", tradeId)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Analysis already exists" }, { status: 409 });
  }

  // Fetch trade with checklist
  const { data: trade, error: tradeError } = await supabase
    .from("trades")
    .select("*, checklist_entries(*)")
    .eq("id", tradeId)
    .single();

  if (tradeError || !trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  if (trade.status !== "closed") {
    return NextResponse.json({ error: "Trade must be closed first" }, { status: 400 });
  }

  const checklist = trade.checklist_entries;
  const pressureLabels: Record<string, string> = {
    fomo: "FOMO (fear of missing out)",
    revenge: "Revenge trading (making up for a loss)",
    boredom: "Boredom (just wanted action)",
    tip: "Following a tip",
    none: "No external pressure",
  };

  const prompt = `You are a trading psychology coach analyzing a completed crypto trade. Provide honest, constructive feedback.

TRADE DATA:
- Coin: ${trade.coin_name} (${trade.coin_symbol})
- Direction: ${trade.trade_type}
- Entry Price: $${trade.entry_price}
- Exit Price: $${trade.exit_price}
- P&L: ${Number(trade.pnl_percent).toFixed(2)}% ($${Number(trade.pnl_amount).toFixed(2)})
- Result: ${trade.is_win ? "WIN" : "LOSS"}
- Exit Reason: ${trade.exit_reason}
- Idea Source: ${trade.idea_source}

PRE-TRADE CHECKLIST (${checklist?.all_passed ? "ALL PASSED" : "NOT ALL PASSED"}):
- Higher timeframes checked: ${checklist?.higher_timeframes ? "Yes" : "No"}
- News checked: ${checklist?.news_check ? "Yes" : "No"}
- Feeling calm: ${checklist?.calm_check ? "Yes" : "No"}
- Stop-loss planned: ${checklist?.stop_loss_set ? "Yes" : "No"}
- Fits trading plan: ${checklist?.in_trading_plan ? "Yes" : "No"}
- Risk/reward defined: ${checklist?.rr_defined ? "Yes" : "No"}
- Position sized: ${checklist?.position_sized ? "Yes" : "No"}

PSYCHOLOGY AT ENTRY:
- Mood: ${trade.entry_mood}/5
- Energy: ${trade.entry_energy}/5
- Confidence: ${trade.entry_confidence}/5
- Reasoning: "${trade.entry_reasoning}"
- Goal: "${trade.entry_goal}"
- External Pressure: ${pressureLabels[trade.external_pressure] || trade.external_pressure}

PSYCHOLOGY AT EXIT:
- Mood: ${trade.exit_mood}/5
- Energy: ${trade.exit_energy}/5
- Confidence: ${trade.exit_confidence}/5

PROCESS RATING RULES:
- GOOD process = checklist all passed AND no FOMO/revenge pressure AND confidence >= 3 AND stop-loss was set
- BAD process = any of those conditions failed

Respond with this exact JSON structure:
{
  "technical_summary": "2-3 sentences about the trade setup and execution",
  "psychology_summary": "2-3 sentences about the trader's mental state and decision-making patterns",
  "process_rating": "good" or "bad",
  "matrix_message": "1-2 sentences of personalized coaching advice based on the process/outcome combination"
}`;

  try {
    const rawText = await callGemini({
      model: "gemini-2.0-flash",
      prompt,
    });

    const parsed: GeminiAnalysisResponse = JSON.parse(rawText);

    // Validate required fields from Gemini response
    if (
      typeof parsed.technical_summary !== "string" ||
      typeof parsed.psychology_summary !== "string" ||
      typeof parsed.matrix_message !== "string" ||
      (parsed.process_rating !== "good" && parsed.process_rating !== "bad")
    ) {
      return NextResponse.json(
        { error: "AI returned an unexpected response format. Please try again." },
        { status: 502 }
      );
    }

    const matrixLabel = getMatrixLabel(parsed.process_rating, trade.is_win);

    const { data: analysis, error: insertError } = await supabase
      .from("trade_analyses")
      .insert({
        user_id: user.id,
        trade_id: tradeId,
        technical_summary: parsed.technical_summary,
        psychology_summary: parsed.psychology_summary,
        process_rating: parsed.process_rating,
        outcome_rating: trade.is_win ? "win" : "loss",
        matrix_label: matrixLabel,
        matrix_message: parsed.matrix_message,
        raw_response: parsed,
      })
      .select()
      .single();

    if (insertError) {
      // Handle unique constraint violation (concurrent duplicate insert)
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Analysis already exists" }, { status: 409 });
      }
      throw insertError;
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    if (err instanceof Error) {
      console.error("Post-trade analysis error:", err.message);
    }
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
