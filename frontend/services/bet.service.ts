import type { Bet } from "@/types/bet.types";

import { apiClient } from "@/lib/api-client";

export interface BetImageResponse {
  imageUrl: string;
  imageBlobId: string;
  betProofBlobAddress: string;
}

export interface WinningImageResponse {
  imageUrl: string;
  imageBlobId: string;
  winningProofBlobAddress: string;
}

export interface BetListResponse {
  success: boolean;
  data: Bet[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface BetDetailsResponse {
  success: boolean;
  data: Bet;
}

export const betService = {
  generateBetImage: async (data: {
    marketId: string;
    question: string;
    position: boolean;
    amount: string;
  }) => {
    return apiClient.post<{
      success: boolean;
      data: BetImageResponse;
    }>("/bets/generate-bet-image", data);
  },

  generateWinningImage: async (data: {
    marketId: string;
    betId: string;
    winningAmount: string | number;
    betAmount: string | number;
  }) => {
    return apiClient.post<{
      success: boolean;
      data: WinningImageResponse;
    }>("/bets/generate-winning-image", data);
  },

  getUserBets: async (
    address: string,
    params?: { limit?: number; offset?: number },
  ) => {
    return apiClient.get<BetListResponse>(
      `/bets/user/${address}`,
      params as Record<string, string | number>,
    );
  },

  getMarketBets: async (
    marketId: string,
    params?: { limit?: number; offset?: number },
  ) => {
    return apiClient.get<BetListResponse>(
      `/bets/market/${marketId}`,
      params as Record<string, string | number>,
    );
  },

  getBetDetails: async (betId: string) => {
    return apiClient.get<BetDetailsResponse>(`/bets/${betId}`);
  },
};
