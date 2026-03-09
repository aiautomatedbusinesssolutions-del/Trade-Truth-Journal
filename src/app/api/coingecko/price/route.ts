import { NextRequest, NextResponse } from "next/server";

const COINGECKO_API_URL =
  process.env.COINGECKO_API_URL || "https://api.coingecko.com/api/v3";

export async function GET(request: NextRequest) {
  const coinId = request.nextUrl.searchParams.get("id");

  if (!coinId) {
    return NextResponse.json(
      { error: "Missing coin id" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd`,
      { next: { revalidate: 30 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "CoinGecko API error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const price = data[coinId]?.usd ?? null;

    return NextResponse.json({ price });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    );
  }
}
