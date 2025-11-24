import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nautilusService } from '@/services/nautilus.service';
import type {
  NautilusHealth,
  NautilusResolution,
  PendingMarket,
  NautilusStats,
  ResolveMarketRequest,
} from '@/services/nautilus.service';

/**
 * Hook to check Nautilus server health
 */
export const useNautilusHealth = () => {
  return useQuery({
    queryKey: ['nautilus-health'],
    queryFn: async () => {
      const response = await nautilusService.checkHealth();
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

/**
 * Hook to get pending markets
 */
export const usePendingMarkets = () => {
  return useQuery({
    queryKey: ['nautilus-pending-markets'],
    queryFn: async () => {
      const response = await nautilusService.getPendingMarkets();
      return response.data?.markets || [];
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

/**
 * Hook to get resolutions for a market
 */
export const useMarketResolutions = (
  marketId?: string,
  options?: { limit?: number; offset?: number },
) => {
  return useQuery({
    queryKey: ['nautilus-resolutions', marketId, options],
    queryFn: async () => {
      if (!marketId) return [];
      const response = await nautilusService.getResolutions({
        marketId,
        ...options,
      });
      return response.data || [];
    },
    enabled: !!marketId,
  });
};

/**
 * Hook to get Nautilus statistics
 */
export const useNautilusStats = () => {
  return useQuery({
    queryKey: ['nautilus-stats'],
    queryFn: async () => {
      const response = await nautilusService.getStats();
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

/**
 * Hook to resolve a market with Nautilus
 */
export const useResolveMarket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      marketId,
      options,
    }: {
      marketId: string;
      options?: ResolveMarketRequest;
    }) => {
      return nautilusService.resolveMarket(marketId, options);
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['market', variables.marketId] });
      queryClient.invalidateQueries({
        queryKey: ['nautilus-resolutions', variables.marketId],
      });
      queryClient.invalidateQueries({ queryKey: ['nautilus-pending-markets'] });
    },
  });
};

/**
 * Hook to resolve all expired markets
 */
export const useResolveAllMarkets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { useNautilus?: boolean }) => {
      return nautilusService.resolveAllMarkets(options);
    },
    onSuccess: () => {
      // Invalidate all market-related queries
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      queryClient.invalidateQueries({ queryKey: ['nautilus-pending-markets'] });
    },
  });
};

