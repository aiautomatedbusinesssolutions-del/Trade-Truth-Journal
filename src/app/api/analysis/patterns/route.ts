import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { callGemini } from "@/lib/services/gemini";
import type { GeminiPatternResponse } from "@/types/analysis";

export async function POST() {
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

  // Fetch all closed trades with checklist data
  const { data: trades, error: tradesError } = await supabase
    .from("trades")
    .select("*, checklist_entries(*)")
    .eq("status", "closed")
    .order("created_at", { ascending: true });

  if (tradesError) {
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 });
  }

  if (!trades || trades.length < 10) {
    return NextResponse.json(
      { error: "At least 10 closed trades are needed for pattern analysis" },
      { status: 400 }
    );
  }

  // Build trade summaries for the prompt
  const tradeSummaries = trades.map((t, i) => {
    const checklist = t.checklist_entries;
    return `Trade ${i + 1}: ${t.coin_name} (${t.coin_symbol}) | ${t.trade_type} | Entry: $${t.entry_price} → Exit: $${t.exit_price} | P&L: ${Number(t.pnl_percent).toFixed(2)}% | ${t.is_win ? "WIN" : "LOSS"} | Mood: ${t.entry_mood}→${t.exit_mood}/5 | Energy: ${t.entry_energy}→${t.exit_energy}/5 | Confidence: ${t.entry_confidence}→${t.exit_confidence}/5 | Pressure: ${t.external_pressure} | Source: ${t.idea_source} | Checklist: ${checklist?.all_passed ? "passed" : "failed"} | Reason: "${t.entry_reasoning}" | Exit: "${t.exit_reason}"`;
  });

  const prompt = `You are an expert trading psychology coach. Analyze the following ${trades.length} completed trades and identify deep patterns in the trader's behavior and psychology.

TRADES:
${tradeSummaries.join("\n")}

Analyze these trades and respond with this exact JSON structure:
{
  "emotion_patterns": [
    { "pattern": "description of emotional pattern", "impact": "positive" or "negative" or "neutral", "frequency": "how often this occurs" }
  ],
  "behavior_patterns": [
    { "behavior": "what the trader does", "outcome": "what typically happens", "suggestion": "actionable advice" }
  ],
  "source_performance": [
    { "source": "idea source name", "win_rate": number 0-100, "avg_pnl": number, "trade_count": number }
  ],
  "psychology_score": number 0-100 representing overall psychological discipline,
  "recommendations": "2-3 paragraphs of personalized coaching advice based on the patterns found"
}

Rules:
- Identify 3-5 emotion patterns
- Identify 3-5 behavior patterns
- Include performance stats for each idea source that appears in the trades
- Be specific and reference actual data from the trades
- Psychology score: 80+ = excellent discipline, 60-79 = good, 40-59 = needs work, <40 = concerning
- Keep recommendations practical and encouraging`;

  try {
    const rawText = await callGemini({
      model: "gemini-2.5-pro",
      prompt,
    });

    const parsed: GeminiPatternResponse = JSON.parse(rawText);

    // Validate required fields
    if (
      !Array.isArray(parsed.emotion_patterns) ||
      !Array.isArray(parsed.behavior_patterns) ||
      !Array.isArray(parsed.source_performance) ||
      typeof parsed.psychology_score !== "number" ||
      typeof parsed.recommendations !== "string"
    ) {
      return NextResponse.json(
        { error: "AI returned an unexpected response format. Please try again." },
        { status: 502 }
      );
    }

    // Validate nested objects
    const validEmotions = parsed.emotion_patterns.every(
      (ep: unknown) =>
        typeof ep === "object" && ep !== null &&
        typeof (ep as Record<string, unknown>).pattern === "string" &&
        ["positive", "negative", "neutral"].includes((ep as Record<string, unknown>).impact as string) &&
        typeof (ep as Record<string, unknown>).frequency === "string"
    );
    const validBehaviors = parsed.behavior_patterns.every(
      (bp: unknown) =>
        typeof bp === "object" && bp !== null &&
        typeof (bp as Record<string, unknown>).behavior === "string" &&
        typeof (bp as Record<string, unknown>).outcome === "string" &&
        typeof (bp as Record<string, unknown>).suggestion === "string"
    );
    const validSources = parsed.source_performance.every(
      (sp: unknown) =>
        typeof sp === "object" && sp !== null &&
        typeof (sp as Record<string, unknown>).source === "string" &&
        typeof (sp as Record<string, unknown>).win_rate === "number" &&
        typeof (sp as Record<string, unknown>).avg_pnl === "number" &&
        typeof (sp as Record<string, unknown>).trade_count === "number"
    );

    if (!validEmotions || !validBehaviors || !validSources) {
      return NextResponse.json(
        { error: "AI returned malformed pattern data. Please try again." },
        { status: 502 }
      );
    }

    const clampedScore = Math.max(0, Math.min(100, Math.round(parsed.psychology_score)));

    const { data: analysis, error: insertError } = await supabase
      .from("pattern_analyses")
      .insert({
        user_id: user.id,
        emotion_patterns: parsed.emotion_patterns,
        behavior_patterns: parsed.behavior_patterns,
        source_performance: parsed.source_performance,
        psychology_score: clampedScore,
        recommendations: parsed.recommendations,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ analysis });
  } catch (err) {
    if (err instanceof Error) {
      console.error("Pattern analysis error:", err.message);
    }
    return NextResponse.json(
      { error: "Pattern analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
