/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';
import dotend from 'dotenv';

import { updateMarketStats } from './market-service';

dotend.config();
const prisma = new PrismaClient();

/**
 * Sync bet from indexer event
 * Called when BetPlacedEvent is processed
 */
export const syncBetFromEvent = async (
  betId: string,
  marketId: string,
  bettor: string,
  position: boolean,
  amount: bigint
) => {
  const existing = await prisma.bet.findUnique({
    where: { betId },
  });

  if (existing) {
    console.log(`✅ Bet ${betId} already synced`);
    return existing;
  }

  let market = await prisma.market.findUnique({
    where: { blockchainMarketId: marketId },
  });

  if (!market) {
    market = await prisma.market.findUnique({
      where: { marketId },
    });
  }

  if (!market) {
    market = await prisma.market.findUnique({
      where: { id: marketId },
    });
  }

  if (!market) {
    console.warn(
      `⚠️  Market ${marketId} does not exist yet, will retry for bet ${betId}`
    );
    throw new Error(`Market ${marketId} not found for bet ${betId}`);
  }

  const bet = await prisma.bet.create({
    data: {
      betId,
      marketId: market.marketId,
      bettor,
      position,
      amount,
    },
  });

  console.log(`💾 Synced bet from event: ${betId}`);

  try {
    await updateMarketStats(market.marketId);
    console.log(`📊 Updated market stats for ${market.marketId}`);
  } catch (error) {
    console.error(`⚠️  Failed to update market stats:`, error);
  }

  return bet;
};

/**
 * Get bet by betId (Sui object ID)
 */
export const getBet = async (betId: string) => {
  return await prisma.bet.findUnique({
    where: { betId },
    include: {
      market: {
        include: {
          protocol: true,
        },
      },
      winningsClaimed: true,
    },
  });
};

/**
 * Get bets by market
 */
export const getBetsByMarket = async (marketId: string) => {
  return await prisma.bet.findMany({
    where: { marketId },
    orderBy: {
      placedAt: 'desc',
    },
    include: {
      market: true,
      winningsClaimed: true,
    },
  });
};

/**
 * Get bets by bettor
 */
export const getBetsByBettor = async (bettor: string) => {
  return await prisma.bet.findMany({
    where: { bettor },
    orderBy: {
      placedAt: 'desc',
    },
    include: {
      market: {
        include: {
          protocol: true,
        },
      },
      winningsClaimed: true,
    },
  });
};

/**
 * Get unclaimed winning bets for a user
 */
export const getUnclaimedWinningBets = async (bettor: string) => {
  const bets = await prisma.bet.findMany({
    where: {
      bettor,
      isClaimed: false,
    },
    include: {
      market: true,
    },
  });

  return bets.filter(
    (bet) => bet.market.isResolved && bet.position === bet.market.outcome
  );
};

/**
 * Mark bet as claimed
 * Called when WinningsClaimedEvent is processed
 */
export const markBetClaimed = async (
  betId: string,
  winningAmount: bigint,
  yieldShare: bigint
) => {
  return await prisma.bet.update({
    where: { betId },
    data: {
      isClaimed: true,
      winningAmount,
      yieldShare,
      claimedAt: new Date(),
    },
  });
};

/**
 * Get bet statistics for a user
 */
export const getBettorStats = async (bettor: string) => {
  const bets = await prisma.bet.findMany({
    where: { bettor },
    include: {
      market: true,
      winningsClaimed: true,
    },
  });

  const totalBets = bets.length;
  const totalAmount = bets.reduce((sum, b) => sum + Number(b.amount), 0);

  const yesBets = bets.filter((b) => b.position === true).length;
  const noBets = bets.filter((b) => b.position === false).length;

  const resolvedBets = bets.filter((b) => b.market.isResolved);
  const wonBets = resolvedBets.filter(
    (b) => b.position === b.market.outcome
  ).length;
  const lostBets = resolvedBets.filter(
    (b) => b.position !== b.market.outcome
  ).length;

  const totalWinnings = bets.reduce(
    (sum, b) => sum + Number(b.winningAmount || 0),
    0
  );
  const totalYieldEarned = bets.reduce(
    (sum, b) => sum + Number(b.yieldShare || 0),
    0
  );

  const claimedBets = bets.filter((b) => b.isClaimed).length;
  const unclaimedWinnings = wonBets - claimedBets;

  const winRate =
    resolvedBets.length > 0 ? (wonBets / resolvedBets.length) * 100 : 0;

  return {
    bettor,
    totalBets,
    totalAmount,
    yesBets,
    noBets,
    resolvedBets: resolvedBets.length,
    wonBets,
    lostBets,
    winRate,
    totalWinnings,
    totalYieldEarned,
    claimedBets,
    unclaimedWinnings,
  };
};

/**
 * Get recent bets across all markets
 */
export const getRecentBets = async (limit: number = 10) => {
  return await prisma.bet.findMany({
    take: limit,
    orderBy: {
      placedAt: 'desc',
    },
    include: {
      market: {
        include: {
          protocol: true,
        },
      },
    },
  });
};

/**
 * Get top bettors by volume
 */
export const getTopBettors = async (limit: number = 10) => {
  const bets = await prisma.bet.findMany({
    include: {
      market: true,
    },
  });

  const bettorStats = bets.reduce(
    (acc, bet) => {
      if (!acc[bet.bettor]) {
        acc[bet.bettor] = {
          bettor: bet.bettor,
          totalVolume: 0,
          betCount: 0,
          wonCount: 0,
          totalWinnings: 0,
        };
      }
      acc[bet.bettor].totalVolume += Number(bet.amount);
      acc[bet.bettor].betCount += 1;
      if (bet.market.isResolved && bet.position === bet.market.outcome) {
        acc[bet.bettor].wonCount += 1;
        acc[bet.bettor].totalWinnings += Number(bet.winningAmount || 0);
      }
      return acc;
    },
    {} as Record<string, any>
  );

  return Object.values(bettorStats)
    .sort((a: any, b: any) => b.totalVolume - a.totalVolume)
    .slice(0, limit);
};
