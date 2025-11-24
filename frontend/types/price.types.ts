export interface Price {
  id: string;
  symbol: string;
  currency: string;
  price: number;
  marketCap?: string;
  volume24h?: string;
  change24h?: number;
  fetchedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OraclePrice {
  id: string;
  symbol: string;
  priceUsd: number;
  txHash?: string;
  blockNumber?: number;
  createdAt: string;
}

export interface PriceStats {
  symbol: string;
  hours: number;
  count: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  priceChange: number;
  priceChangePercent: number;
  oldestTimestamp: string;
  latestTimestamp: string;
}

export interface PriceChartPoint {
  timestamp: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  count: number;
}
