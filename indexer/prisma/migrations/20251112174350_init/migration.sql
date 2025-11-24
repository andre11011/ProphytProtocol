-- CreateTable
CREATE TABLE "Cursor" (
    "id" TEXT NOT NULL,
    "eventSeq" TEXT NOT NULL,
    "txDigest" TEXT NOT NULL,

    CONSTRAINT "Cursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProphetMarketCreatedEvent" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "creator" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "duration" BIGINT NOT NULL,
    "txDigest" TEXT NOT NULL,
    "eventSeq" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "timestampMs" BIGINT NOT NULL,
    "rawData" TEXT NOT NULL,

    CONSTRAINT "ProphetMarketCreatedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProphetBetPlacedEvent" (
    "id" TEXT NOT NULL,
    "betId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "bettor" TEXT NOT NULL,
    "position" BOOLEAN NOT NULL,
    "amount" BIGINT NOT NULL,
    "nftId" TEXT,
    "txDigest" TEXT NOT NULL,
    "eventSeq" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "timestampMs" BIGINT NOT NULL,
    "rawData" TEXT NOT NULL,

    CONSTRAINT "ProphetBetPlacedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProphetMarketResolvedEvent" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcome" BOOLEAN NOT NULL,
    "totalYieldEarned" BIGINT NOT NULL,
    "txDigest" TEXT NOT NULL,
    "eventSeq" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "timestampMs" BIGINT NOT NULL,
    "rawData" TEXT NOT NULL,

    CONSTRAINT "ProphetMarketResolvedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProphetWinningsClaimedEvent" (
    "id" TEXT NOT NULL,
    "betId" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "winningAmount" BIGINT NOT NULL,
    "yieldShare" BIGINT NOT NULL,
    "nftId" TEXT,
    "txDigest" TEXT NOT NULL,
    "eventSeq" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "timestampMs" BIGINT NOT NULL,
    "rawData" TEXT NOT NULL,

    CONSTRAINT "ProphetWinningsClaimedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProphetYieldDepositedEvent" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "txDigest" TEXT NOT NULL,
    "eventSeq" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "timestampMs" BIGINT NOT NULL,
    "rawData" TEXT NOT NULL,

    CONSTRAINT "ProphetYieldDepositedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetProofNFTMintedEvent" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "betId" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "position" BOOLEAN NOT NULL,
    "betAmount" BIGINT NOT NULL,
    "blobAddress" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageBlobId" TEXT NOT NULL,
    "txDigest" TEXT NOT NULL,
    "eventSeq" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "timestampMs" BIGINT NOT NULL,
    "rawData" TEXT NOT NULL,

    CONSTRAINT "BetProofNFTMintedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WinningProofNFTMintedEvent" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "betId" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "winningAmount" BIGINT NOT NULL,
    "profitPercentage" BIGINT NOT NULL,
    "blobAddress" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageBlobId" TEXT NOT NULL,
    "txDigest" TEXT NOT NULL,
    "eventSeq" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "timestampMs" BIGINT NOT NULL,
    "rawData" TEXT NOT NULL,

    CONSTRAINT "WinningProofNFTMintedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketResolved" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcome" BOOLEAN NOT NULL,
    "totalYieldEarned" BIGINT NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketResolved_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Protocol" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "apy" TEXT,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Protocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "adjTicker" TEXT,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "rules" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "probability" DOUBLE PRECISION DEFAULT 0,
    "creator" TEXT NOT NULL,
    "platform" TEXT DEFAULT 'prophyt',
    "protocolId" TEXT,
    "volume" BIGINT NOT NULL DEFAULT 0,
    "openInterest" BIGINT NOT NULL DEFAULT 0,
    "totalYesBets" BIGINT NOT NULL DEFAULT 0,
    "totalNoBets" BIGINT NOT NULL DEFAULT 0,
    "totalYieldEarned" BIGINT NOT NULL DEFAULT 0,
    "endDate" TIMESTAMP(3) NOT NULL,
    "resolutionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "outcome" BOOLEAN,
    "externalLink" TEXT,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "betId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "bettor" TEXT NOT NULL,
    "position" BOOLEAN NOT NULL,
    "amount" BIGINT NOT NULL,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "winningAmount" BIGINT,
    "yieldShare" BIGINT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WinningsClaimed" (
    "id" TEXT NOT NULL,
    "betId" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "winningAmount" BIGINT NOT NULL,
    "yieldShare" BIGINT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WinningsClaimed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YieldDeposit" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "depositedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txDigest" TEXT,
    "eventSeq" TEXT,

    CONSTRAINT "YieldDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "chartType" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChartCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProphetMarketCreatedEvent_marketId_key" ON "ProphetMarketCreatedEvent"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "ProphetMarketCreatedEvent_txDigest_eventSeq_key" ON "ProphetMarketCreatedEvent"("txDigest", "eventSeq");

-- CreateIndex
CREATE UNIQUE INDEX "ProphetBetPlacedEvent_betId_key" ON "ProphetBetPlacedEvent"("betId");

-- CreateIndex
CREATE UNIQUE INDEX "ProphetBetPlacedEvent_txDigest_eventSeq_key" ON "ProphetBetPlacedEvent"("txDigest", "eventSeq");

-- CreateIndex
CREATE UNIQUE INDEX "ProphetMarketResolvedEvent_marketId_key" ON "ProphetMarketResolvedEvent"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "ProphetMarketResolvedEvent_txDigest_eventSeq_key" ON "ProphetMarketResolvedEvent"("txDigest", "eventSeq");

-- CreateIndex
CREATE UNIQUE INDEX "ProphetWinningsClaimedEvent_betId_key" ON "ProphetWinningsClaimedEvent"("betId");

-- CreateIndex
CREATE UNIQUE INDEX "ProphetWinningsClaimedEvent_txDigest_eventSeq_key" ON "ProphetWinningsClaimedEvent"("txDigest", "eventSeq");

-- CreateIndex
CREATE UNIQUE INDEX "ProphetYieldDepositedEvent_txDigest_eventSeq_key" ON "ProphetYieldDepositedEvent"("txDigest", "eventSeq");

-- CreateIndex
CREATE UNIQUE INDEX "BetProofNFTMintedEvent_nftId_key" ON "BetProofNFTMintedEvent"("nftId");

-- CreateIndex
CREATE UNIQUE INDEX "BetProofNFTMintedEvent_txDigest_eventSeq_key" ON "BetProofNFTMintedEvent"("txDigest", "eventSeq");

-- CreateIndex
CREATE UNIQUE INDEX "WinningProofNFTMintedEvent_nftId_key" ON "WinningProofNFTMintedEvent"("nftId");

-- CreateIndex
CREATE UNIQUE INDEX "WinningProofNFTMintedEvent_txDigest_eventSeq_key" ON "WinningProofNFTMintedEvent"("txDigest", "eventSeq");

-- CreateIndex
CREATE UNIQUE INDEX "MarketResolved_marketId_key" ON "MarketResolved"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "Protocol_name_key" ON "Protocol"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Protocol_stateId_key" ON "Protocol"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "Market_marketId_key" ON "Market"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "Market_adjTicker_key" ON "Market"("adjTicker");

-- CreateIndex
CREATE INDEX "Market_status_idx" ON "Market"("status");

-- CreateIndex
CREATE INDEX "Market_creator_idx" ON "Market"("creator");

-- CreateIndex
CREATE INDEX "Market_protocolId_idx" ON "Market"("protocolId");

-- CreateIndex
CREATE INDEX "Market_adjTicker_idx" ON "Market"("adjTicker");

-- CreateIndex
CREATE UNIQUE INDEX "Bet_betId_key" ON "Bet"("betId");

-- CreateIndex
CREATE INDEX "Bet_marketId_idx" ON "Bet"("marketId");

-- CreateIndex
CREATE INDEX "Bet_bettor_idx" ON "Bet"("bettor");

-- CreateIndex
CREATE INDEX "Bet_isClaimed_idx" ON "Bet"("isClaimed");

-- CreateIndex
CREATE UNIQUE INDEX "WinningsClaimed_betId_key" ON "WinningsClaimed"("betId");

-- CreateIndex
CREATE INDEX "WinningsClaimed_user_idx" ON "WinningsClaimed"("user");

-- CreateIndex
CREATE INDEX "YieldDeposit_marketId_idx" ON "YieldDeposit"("marketId");

-- CreateIndex
CREATE INDEX "YieldDeposit_txDigest_eventSeq_idx" ON "YieldDeposit"("txDigest", "eventSeq");

-- CreateIndex
CREATE UNIQUE INDEX "ChartCache_cacheKey_key" ON "ChartCache"("cacheKey");

-- CreateIndex
CREATE INDEX "ChartCache_cacheKey_idx" ON "ChartCache"("cacheKey");

-- CreateIndex
CREATE INDEX "ChartCache_expiresAt_idx" ON "ChartCache"("expiresAt");

-- CreateIndex
CREATE INDEX "ChartCache_chartType_idx" ON "ChartCache"("chartType");

-- AddForeignKey
ALTER TABLE "MarketResolved" ADD CONSTRAINT "MarketResolved_market_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("marketId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketResolved" ADD CONSTRAINT "MarketResolved_event_fkey" FOREIGN KEY ("marketId") REFERENCES "ProphetMarketResolvedEvent"("marketId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "ProphetMarketCreatedEvent"("marketId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("marketId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_betId_fkey" FOREIGN KEY ("betId") REFERENCES "ProphetBetPlacedEvent"("betId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WinningsClaimed" ADD CONSTRAINT "WinningsClaimed_bet_fkey" FOREIGN KEY ("betId") REFERENCES "Bet"("betId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WinningsClaimed" ADD CONSTRAINT "WinningsClaimed_event_fkey" FOREIGN KEY ("betId") REFERENCES "ProphetWinningsClaimedEvent"("betId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YieldDeposit" ADD CONSTRAINT "YieldDeposit_market_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("marketId") ON DELETE RESTRICT ON UPDATE CASCADE;
