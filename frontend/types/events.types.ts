export interface ProphetMarketCreatedEvent {
  id: string;
  marketId: string;
  blockchainMarketId?: string;
  creator: string;
  question: string;
  duration: string;
  txDigest: string;
  eventSeq: string;
  sender: string;
  timestampMs: string;
  rawData: string;
}

export interface ProphetBetPlacedEvent {
  id: string;
  betId: string;
  marketId: string;
  bettor: string;
  position: boolean;
  amount: string;
  nftId?: string;
  txDigest: string;
  eventSeq: string;
  sender: string;
  timestampMs: string;
  rawData: string;
}

export interface ProphetMarketResolvedEvent {
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

export interface ProphetWinningsClaimedEvent {
  id: string;
  betId: string;
  user: string;
  winningAmount: string;
  yieldShare: string;
  nftId?: string;
  txDigest: string;
  eventSeq: string;
  sender: string;
  timestampMs: string;
  rawData: string;
}

export interface ProphetYieldDepositedEvent {
  id: string;
  marketId: string;
  amount: string;
  txDigest: string;
  eventSeq: string;
  sender: string;
  timestampMs: string;
  rawData: string;
}

export interface BetProofNFTMintedEvent {
  id: string;
  marketId: string;
  betId: string;
  nftId: string;
  owner: string;
  position: boolean;
  betAmount: string;
  blobAddress: string;
  imageUrl: string;
  imageBlobId: string;
  txDigest: string;
  eventSeq: string;
  sender: string;
  timestampMs: string;
  rawData: string;
}

export interface WinningProofNFTMintedEvent {
  id: string;
  marketId: string;
  betId: string;
  nftId: string;
  owner: string;
  winningAmount: string;
  profitPercentage: string;
  blobAddress: string;
  imageUrl: string;
  imageBlobId: string;
  txDigest: string;
  eventSeq: string;
  sender: string;
  timestampMs: string;
  rawData: string;
}

export interface ChartCache {
  id: string;
  cacheKey: string;
  chartType: string;
  dataJson: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cursor {
  id: string;
  eventSeq: string;
  txDigest: string;
}
