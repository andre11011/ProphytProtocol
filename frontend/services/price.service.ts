import type { ApiResponse } from "@/types/api.types";

import { apiClient } from "@/lib/api-client";

export interface OraclePriceResponse {
  symbol: string;
  currency: string;
  price: number;
  marketCap: string | null;
  volume24h: string | null;
  change24h: number;
  fetchedAt: string;
}

export const priceService = {
  getLatestPrice: async (params?: { symbol?: string; refresh?: boolean }) => {
    const sanitizedParams = params
      ? (Object.fromEntries(
          Object.entries(params).map(([k, v]) => [
            k,
            typeof v === "boolean" ? String(v) : v,
          ]),
        ) as Record<string, string | number>)
      : undefined;

    return apiClient.get<
      ApiResponse<OraclePriceResponse> & {
        success: boolean;
        meta: { timestamp: string };
      }
    >("/oracle/price/latest", sanitizedParams);
  },
};
