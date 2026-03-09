import type { CoinSearchResult } from "@/types/coingecko";

export async function searchCoins(query: string): Promise<CoinSearchResult[]> {
  if (query.trim().length < 2) return [];

  const res = await fetch(`/api/coingecko/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];

  const data = await res.json();
  return data.coins || [];
}

export async function getCoinPrice(coinId: string): Promise<number | null> {
  const res = await fetch(`/api/coingecko/price?id=${encodeURIComponent(coinId)}`);
  if (!res.ok) return null;

  const data = await res.json();
  return data.price ?? null;
}
