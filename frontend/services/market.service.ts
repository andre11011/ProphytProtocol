import type { Market } from "@/types/market.types";
import type { ApiResponse } from "@/types/api.types";

import { apiClient } from "@/lib/api-client";

export const marketService = {
  /**
   * Get all markets with optional filtering and pagination
   * @param params - Query parameters for filtering markets
   * @returns List of markets with pagination metadata
   */
  getMarkets: async (params?: {
    limit?: number;
    offset?: number;
    status?: "active" | "resolved" | "all";
    protocolId?: string;
  }) => {
    return apiClient.get<
      ApiResponse<Market[]> & {
        success: boolean;
        meta: {
          total: number;
          limit: number;
          offset: number;
        };
      }
    >("/markets", params as Record<string, string | number>);
  },

  /**
   * Get a specific market by ID
   * @deprecated Use getMarket instead
   * @param id - Market ID
   * @returns Market details
   */
  getMarketById: async (id: string) => {
    return apiClient.get<ApiResponse<Market>>(`/markets/${id}`);
  },

  updateMarketImage: async (marketId: string, imageUrl: string) => {
    return apiClient.put<ApiResponse<Market>>(`/markets/${marketId}/image`, {
      imageUrl,
    });
  },
};
