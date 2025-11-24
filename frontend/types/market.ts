export interface Protocol {
  id: string;
  name: string;
  stateId: string;
  apy?: string;
  displayName: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Market {
  id: string;
  marketId: string;
  blockchainMarketId?: string;
  adjTicker?: string;
  question: string;
  description?: string;
  rules?: string;
  imageUrl?: string;
  status: string;
  probability?: number;
  creator: string;
  platform?: string;
  protocolId?: string;
  protocol?: Protocol;
  volume: string;
  openInterest: string;
  totalYesBets: string;
  totalNoBets: string;
  totalYesCount: number;
  totalNoCount: number;
  totalPoolSize: string;
  totalYieldEarned: string;
  endDate: string;
  resolutionDate?: string;
  createdAt: string;
  updatedAt: string;
  isResolved: boolean;
  outcome?: boolean;
  externalLink?: string;
  bets?: Bet[];
  yieldDeposits?: YieldDeposit[];
  marketResolvedEvent?: MarketResolvedEvent;
  _count?: {
    bets: number;
  };
}

export interface Bet {
  id: string;
  betId: string;
  marketId: string;
  market?: Market;
  bettor: string;
  position: boolean;
  amount: string;
  isClaimed: boolean;
  winningAmount?: string;
  yieldShare?: string;
  placedAt: string;
  claimedAt?: string;
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

export interface YieldDeposit {
  id: string;
  marketId: string;
  amount: string;
  depositedAt: string;
  txDigest?: string;
  eventSeq?: string;
}

export interface MarketResolvedEvent {
  id: string;
  marketId: string;
  outcome: boolean;
  totalYieldEarned: string;
  txDigest: string;
  eventSeq: string;
  sender: string;
  timestampMs: string;
  rawData: string;
}

export interface MarketListResponse {
  success: boolean;
  data: Market[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface MarketDetailResponse {
  success: boolean;
  data: Market;
}

export interface MarketFilters {
  status?: string;
  protocolId?: string;
  limit?: number;
  offset?: number;
}

export interface BettorStats {
  bettor: string;
  totalBets: number;
  totalAmount: number;
  yesBets: number;
  noBets: number;
  resolvedBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  totalWinnings: number;
  totalYieldEarned: number;
  claimedBets: number;
  unclaimedWinnings: number;
}

export interface MarketStats {
  marketId: string;
  question: string;
  status: string;
  probability: number;
  volume: number;
  openInterest: number;
  totalYesBets: number;
  totalNoBets: number;
  totalYesCount: number;
  totalNoCount: number;
  totalPoolSize: number;
  totalBets: number;
  uniqueBettors: number;
  totalYieldEarned: number;
  totalYieldDeposits: number;
  isResolved: boolean;
  outcome?: boolean;
  endDate: string;
  resolutionDate?: string;
}

export interface MarketCreatedEventData {
  market_id: string;
  creator: string;
  question: string;
  end_time: string;
}

export interface BetPlacedEventData {
  bet_id: string;
  market_id: string;
  user: string;
  position: boolean;
  amount: string;
  nft_id: string;
}

export interface MarketResolvedEventData {
  market_id: string;
  outcome: boolean;
  total_yield_earned: string;
}

export interface WinningsClaimedEventData {
  bet_id: string;
  user: string;
  winning_amount: string;
  yield_share: string;
  nft_id: string;
}
