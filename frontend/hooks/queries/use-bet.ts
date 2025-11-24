import { useQuery } from "@tanstack/react-query";

import { betService } from "@/services/bet.service";

export const useUserBets = (
  address: string,
  params?: { limit?: number; offset?: number },
  enabled = true,
) => {
  return useQuery({
    queryKey: ["user", address, "bets", params],
    queryFn: () => betService.getUserBets(address, params),
    enabled: enabled && !!address,
  });
};

export const useMarketBets = (
  marketId: string,
  params?: { limit?: number; offset?: number },
  enabled = true,
) => {
  return useQuery({
    queryKey: ["market", marketId, "bets", params],
    queryFn: () => betService.getMarketBets(marketId, params),
    enabled: enabled && !!marketId,
  });
};
