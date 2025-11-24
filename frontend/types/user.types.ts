export interface User {
  address: string;
  createdAt: string;
}

export interface UserStats {
  address: string;
  totalBets: number;
  totalVolume: string;
  winRate: number;
}
