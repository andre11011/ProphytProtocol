export interface Bet {
  id: string;
  betId: string;
  marketId: string;
  bettor: string;
  position: boolean;
  amount: string;
  isClaimed: boolean;
  winningAmount?: string;
  yieldShare?: string;
  placedAt: string;
  claimedAt?: string;
  market?: any;
  winningsClaimed?: WinningsClaimed;
}

export interface WinningsClaimed {
  id: string;
  betId: string;
  user: string;
  winningAmount: string;
  yieldShare: string;
  claimedAt: string;
}

export interface BetStats {
  totalBets: number;
  activeBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  totalAmount: string;
  totalPayout: string;
  profit: string;
}

export interface PlaceBetRequest {
  marketId: string;
  position: boolean;
  amount: string;
  bettor: string;
}

export interface PlaceBetResult {
  betId: string;
  marketId: string;
  position: boolean;
  amount: string;
  bettor: string;
  placedAt: string;
}

export interface GenerateBetImageRequest {
  marketId: string;
  question: string;
  position: boolean;
  amount: string;
}

export interface GenerateWinningImageRequest {
  marketId: string;
  betId: string;
  winningAmount: string;
  betAmount: string;
}

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
