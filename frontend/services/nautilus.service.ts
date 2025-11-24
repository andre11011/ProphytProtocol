import type { ApiResponse } from '@/types/api.types';
import { apiClient } from '@/lib/api-client';

export interface NautilusHealth {
  healthy: boolean;
  serverUrl: string;
  enabled: boolean;
}

export interface NautilusResolution {
  market_id: string;
  outcome: boolean;
  source_data: string;
  source_data_hash: string;
  resolution_timestamp: number;
  media_hash: string;
  signature: string;
  public_key: string;
  created_at: string;
}

export interface PendingMarket {
  market_id: string;
  question: string;
  end_date: string;
  external_link?: string;
}

export interface NautilusStats {
  totalResolutions: number;
  recentResolutions: Array<{
    outcome: boolean;
    count: number;
  }>;
  serverHealthy: boolean;
  serverUrl: string;
  enabled: boolean;
}

export interface ResolveMarketRequest {
  useNautilus?: boolean;
  dataSourceUrl?: string;
}

export const nautilusService = {
  /**
   * Check Nautilus server health
   */
  checkHealth: async () => {
    return apiClient.get<ApiResponse<NautilusHealth>>('/nautilus/health');
  },

  /**
   * Get markets pending resolution
   */
  getPendingMarkets: async () => {
    return apiClient.get<
      ApiResponse<{
        markets: PendingMarket[];
      }>
    >('/nautilus/pending-markets');
  },

  /**
   * Get resolution history
   */
  getResolutions: async (params?: {
    marketId?: string;
    limit?: number;
    offset?: number;
  }) => {
    return apiClient.get<ApiResponse<NautilusResolution[]>>(
      '/nautilus/resolutions',
      params as Record<string, string | number>,
    );
  },

  /**
   * Manually trigger market resolution using Nautilus
   */
  resolveMarket: async (
    marketId: string,
    options?: ResolveMarketRequest,
  ) => {
    return apiClient.post<ApiResponse<{ message: string }>>(
      `/nautilus/resolve/${marketId}`,
      options,
    );
  },

  /**
   * Resolve all expired markets
   */
  resolveAllMarkets: async (options?: { useNautilus?: boolean }) => {
    return apiClient.post<ApiResponse<{ message: string }>>(
      '/nautilus/resolve-all',
      options,
    );
  },

  /**
   * Get Nautilus statistics
   */
  getStats: async () => {
    return apiClient.get<ApiResponse<NautilusStats>>('/nautilus/stats');
  },
};

