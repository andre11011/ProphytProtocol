import { Protocol } from "./protocol.types";

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
  totalPoolSize: string;
  totalYesBets: string;
  totalNoBets: string;
  totalYesCount: number;
  totalNoCount: number;
  totalYieldEarned: string;
  endDate: string;
  resolutionDate?: string;
  createdAt: string;
  updatedAt: string;
  isResolved: boolean;
  outcome?: boolean;
  externalLink?: string;
  bets?: any[];
  yieldDeposits?: YieldDeposit[];
  marketResolvedEvent?: MarketResolved;
  _count?: {
    bets: number;
  };
}

export interface YieldDeposit {
  id: string;
  marketId: string;
  amount: string;
  depositedAt: string;
  txDigest?: string;
  eventSeq?: string;
}

export interface MarketResolved {
  id: string;
  marketId: string;
  outcome: boolean;
  totalYieldEarned: string;
  resolvedAt: string;
}

export interface OptionStats {
  OptionName: string;
  TotalStaked: string;
  ParticipantCount: number;
  Percentage: number;
}

export interface CreateMarketRequest {
  question: string;
  description?: string;
  duration: number;
  yieldProtocol?: string;
  imageUrl?: string;
}

export interface UpdateMarketImageRequest {
  imageUrl: string | null;
}
