import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const COINGECKO_API_URL =
  process.env.COINGECKO_API_URL || "https://api.coingecko.com/api/v3";

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

  // Fetch due hindsight checks (not completed, check_date in the past)
  const { data: dueChecks, error: fetchError } = await supabase
    .from("hindsight_checks")
    .select("id, trade_id, check_type")
    .eq("is_completed", false)
    .lte("check_date", new Date().toISOString());

  if (fetchError) {
    return NextResponse.json({ error: "Failed to fetch checks" }, { status: 500 });
  }

  if (!dueChecks || dueChecks.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  // Get unique trade IDs to fetch coin_id and exit_price
  const tradeIds = [...new Set(dueChecks.map((c) => c.trade_id))];

  const { data: trades, error: tradesError } = await supabase
    .from("trades")
    .select("id, coin_id, exit_price")
    .in("id", tradeIds);

  if (tradesError || !trades) {
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 });
  }

  const tradeMap = new Map(trades.map((t) => [t.id, t]));

  // Group checks by coin_id to minimize API calls
  const coinIds = [...new Set(trades.map((t) => t.coin_id))];

  // Fetch current prices for all coins in one call
  let priceMap: Record<string, number> = {};
  if (coinIds.length > 0) {
    try {
      const res = await fetch(
        `${COINGECKO_API_URL}/simple/price?ids=${coinIds.map(encodeURIComponent).join(",")}&vs_currencies=usd`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        for (const coinId of coinIds) {
          if (data[coinId]?.usd) {
            priceMap[coinId] = data[coinId].usd;
          }
        }
      }
    } catch {
      // If price fetch fails, we'll skip updates for those coins
    }
  }

  // Update each due check
  let processed = 0;
  for (const check of dueChecks) {
    const trade = tradeMap.get(check.trade_id);
    if (!trade) continue;

    const currentPrice = priceMap[trade.coin_id];
    if (currentPrice === undefined) continue;

    const exitPrice = Number(trade.exit_price);
    if (exitPrice <= 0) continue;

    const priceChangePercent = ((currentPrice - exitPrice) / exitPrice) * 100;

    const { error: updateError } = await supabase
      .from("hindsight_checks")
      .update({
        price_at_check: currentPrice,
        price_change_percent: priceChangePercent,
        is_completed: true,
      })
      .eq("id", check.id);

    if (!updateError) {
      processed++;
    }
  }

  return NextResponse.json({ processed });
}
