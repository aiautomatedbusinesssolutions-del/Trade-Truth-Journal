"use client";

import { useState, useEffect, useRef } from "react";
import { searchCoins } from "@/lib/services/coingecko";
import type { CoinSearchResult } from "@/types/coingecko";

interface CoinSearchProps {
  onSelect: (coin: CoinSearchResult) => void;
  selected: CoinSearchResult | null;
}

export default function CoinSearch({ onSelect, selected }: CoinSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CoinSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const requestIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    const currentRequestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      try {
        const coins = await searchCoins(value);
        if (currentRequestId !== requestIdRef.current) return;
        setResults(coins);
        setIsOpen(coins.length > 0);
      } catch {
        if (currentRequestId !== requestIdRef.current) return;
        setResults([]);
        setIsOpen(false);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 300);
  };

  const handleSelect = (coin: CoinSearchResult) => {
    onSelect(coin);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null as unknown as CoinSearchResult);
    setQuery("");
  };

  if (selected) {
    return (
      <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5">
        {selected.thumb && (
          <img
            src={selected.thumb}
            alt={selected.name}
            className="w-6 h-6 rounded-full"
          />
        )}
        <div className="flex-1">
          <span className="text-slate-100 font-medium">{selected.name}</span>
          <span className="text-slate-400 ml-2 text-sm uppercase">
            {selected.symbol}
          </span>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-slate-500 hover:text-slate-300 text-sm"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search for a coin (e.g. Bitcoin, ETH)..."
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
      />
      {loading && (
        <div className="absolute right-3 top-3 text-slate-500 text-sm">
          Searching...
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {results.map((coin) => (
            <button
              key={coin.id}
              type="button"
              onClick={() => handleSelect(coin)}
              className="w-full text-left px-4 py-3 hover:bg-slate-700 flex items-center gap-3 transition-colors"
            >
              {coin.thumb && (
                <img
                  src={coin.thumb}
                  alt={coin.name}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <div>
                <span className="text-slate-100">{coin.name}</span>
                <span className="text-slate-400 ml-2 text-sm uppercase">
                  {coin.symbol}
                </span>
              </div>
              {coin.market_cap_rank && (
                <span className="ml-auto text-slate-500 text-xs">
                  #{coin.market_cap_rank}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
