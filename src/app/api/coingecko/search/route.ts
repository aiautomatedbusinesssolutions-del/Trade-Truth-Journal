import { NextRequest, NextResponse } from "next/server";

const COINGECKO_API_URL =
  process.env.COINGECKO_API_URL || "https://api.coingecko.com/api/v3";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ coins: [] });
  }

  try {
    const res = await fetch(
      `${COINGECKO_API_URL}/search?query=${encodeURIComponent(query.trim())}`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "CoinGecko API error" },
        { status: res.status }
      );
    }

    const data = await res.json();

    const coins = (data.coins || []).slice(0, 10).map(
      (coin: { id: string; name: string; symbol: string; thumb: string; large: string; market_cap_rank: number | null }) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        thumb: coin.thumb,
        large: coin.large,
        market_cap_rank: coin.market_cap_rank,
      })
    );

    return NextResponse.json({ coins });
  } catch {
    return NextResponse.json(
      { error: "Failed to search coins" },
      { status: 500 }
    );
  }
}
