export interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  large: string;
  market_cap_rank: number | null;
}

export interface CoinSearchResponse {
  coins: CoinSearchResult[];
}
