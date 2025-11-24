import type { Bet } from "@/types/bet.types";

import { apiClient } from "@/lib/api-client";

export interface UserBetsResponse {
  success: boolean;
  data: Bet[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export const userService = {
  getUserBets: async (
    address: string,
    params?: { limit?: number; offset?: number },
  ) => {
    return apiClient.get<UserBetsResponse>(
      `/users/${address}/bets`,
      params as Record<string, string | number>,
    );
  },
};
