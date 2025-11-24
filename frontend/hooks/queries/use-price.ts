import { useQuery } from "@tanstack/react-query";

import { priceService } from "@/services/price.service";

export const useLatestPrice = (params?: { symbol?: string }) => {
  return useQuery({
    queryKey: ["price", "latest", params],
    queryFn: () => priceService.getLatestPrice(params),
    refetchInterval: 60000,
  });
};
