import { useQuery } from "@tanstack/react-query";

import { marketService } from "@/services/market.service";

export const useMarkets = (params?: {
  limit?: number;
  offset?: number;
  status?: "active" | "resolved" | "all";
  sort_by?:
    | "end_time"
    | "transaction_version"
    | "tvl"
    | "created_at"
    | "question";
  order?: "asc" | "desc";
}) => {
  return useQuery({
    queryKey: ["markets", params],
    queryFn: () => marketService.getMarkets(params),
  });
};

export const useMarket = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ["market", id],
    queryFn: () => marketService.getMarketById(id),
    enabled: enabled && !!id,
  });
};
