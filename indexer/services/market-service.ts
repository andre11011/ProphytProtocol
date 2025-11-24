/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';
import dotend from 'dotenv';

import { AdjacentMarket, getQualityMarkets } from './adjacent';
import { getImage } from './image-service';
import { getProtocolByName, getRandomProtocol } from './protocol-service';
import { createMarket as createMarketOnSui } from './sui-client';

dotend.config();
const prisma = new PrismaClient();

export interface SeedMarketsOptions {
  count?: number;
  minDescLength?: number;
  protocolName?: 'suilend' | 'haedal' | 'volo';
}

/**
 * Convert Adjacent market data to database market format
 */
const convertAdjacentMarket = async (
  adjMarket: AdjacentMarket,
  marketId: string,
  creator: string,
  protocolId?: string
) => {
  const imageUrl = getImage(adjMarket.question);

  return {
    marketId,
    adjTicker: adjMarket.adjTicker,
    question: adjMarket.question,
    description: adjMarket.description || undefined,
    rules: adjMarket.rules || undefined,
    imageUrl,
    status: 'active',
    probability: adjMarket.probability || 0,
    creator,
    platform: adjMarket.platform || 'prophyt',
    protocolId,
    volume: BigInt(Math.floor(adjMarket.volume || 0)),
    openInterest: BigInt(Math.floor(adjMarket.openInterest || 0)),
    endDate: new Date(adjMarket.endDate),
    resolutionDate: adjMarket.resolutionDate
      ? new Date(adjMarket.resolutionDate)
      : undefined,
    externalLink: adjMarket.link || undefined,
  };
};

/**
 * Seed markets from Adjacent API
 * Flow: Fetch from Adjacent -> Create on Sui -> Store in DB
 */
export const seedMarkets = async (options: SeedMarketsOptions = {}) => {
  const { count = 5, minDescLength = 50, protocolName } = options;

  console.log(`🌱 Seeding ${count} markets from Adjacent API...`);

  const apiKey = process.env.ADJACENT_API_KEY;
  if (!apiKey) {
    throw new Error('ADJACENT_API_KEY environment variable not set');
  }

  const protocol = protocolName
    ? await getProtocolByName(protocolName)
    : await getRandomProtocol();

  if (!protocol) {
    throw new Error(`Protocol not found: ${protocolName || 'random'}`);
  }

  console.log(`📡 Using protocol: ${protocol.displayName}`);

  const response = await getQualityMarkets(apiKey, count, minDescLength);
  const adjacentMarkets = response.data;

  console.log(`✅ Fetched ${adjacentMarkets.length} markets from Adjacent`);

  const createdMarkets = [];
  const errors = [];

  for (const adjMarket of adjacentMarkets) {
    try {
      if (!adjMarket.question || !adjMarket.endDate) {
        console.log(`⏭️  Market missing required fields, skipping`);
        continue;
      }

      if (adjMarket.adjTicker) {
        const existing = await prisma.market.findUnique({
          where: { adjTicker: adjMarket.adjTicker },
        });

        if (existing) {
          console.log(
            `⏭️  Market ${adjMarket.adjTicker} already exists, skipping`
          );
          continue;
        }
      }

      const endDate = new Date(adjMarket.endDate);
      const now = new Date();
      const duration = endDate.getTime() - now.getTime();

      if (duration <= 0) {
        console.log(`⏭️  Market has already ended, skipping`);
        continue;
      }

      console.log(
        `🔨 Creating market: ${adjMarket.question.substring(0, 60)}...`
      );

      let suiResult;
      try {
        suiResult = await createMarketOnSui({
          question: adjMarket.question,
          description: adjMarket.description,
          duration,
        });
        console.log(`✅ Created on Sui: ${suiResult.marketId}`);
      } catch (suiError) {
        const errorMsg =
          suiError instanceof Error ? suiError.message : String(suiError);
        if (errorMsg.includes('No valid gas coins')) {
          console.log(
            `⚠️  Skipping Sui creation (insufficient gas), storing in DB only`
          );

          const uniqueId = `pending_${Date.now()}_${Math.random().toString(36).substring(2)}`;
          suiResult = {
            marketId: uniqueId,
            txDigest: 'pending',
            effects: null,
          };
        } else {
          throw suiError;
        }
      }

      const creator =
        process.env.PROPHYT_DEPLOYER || process.env.PROPHYT_DEPLOYER || '';

      const marketData = await convertAdjacentMarket(
        adjMarket,
        suiResult.marketId,
        creator,
        protocol.id
      );

      const timestampMs = Date.now();

      const uniqueTxDigest =
        suiResult.txDigest === 'pending'
          ? `pending_${suiResult.marketId}`
          : suiResult.txDigest;
      const eventSeq =
        suiResult.txDigest === 'pending' ? suiResult.marketId : '0';

      await prisma.prophetMarketCreatedEvent.create({
        data: {
          marketId: suiResult.marketId,
          creator,
          question: adjMarket.question,
          duration: BigInt(duration),
          txDigest: uniqueTxDigest,
          eventSeq,
          sender: creator,
          timestampMs: BigInt(timestampMs),
          rawData: JSON.stringify({
            marketId: suiResult.marketId,
            question: adjMarket.question,
            duration,
            source: 'adjacent_seed',
          }),
        },
      });

      const market = await prisma.market.create({
        data: marketData,
      });

      console.log(`💾 Stored in DB: ${market.id}`);
      createdMarkets.push(market);
    } catch (error) {
      const marketIdentifier =
        adjMarket.adjTicker ||
        adjMarket.question?.substring(0, 30) ||
        'unknown';
      console.error(`❌ Error creating market ${marketIdentifier}:`, error);
      errors.push({ market: marketIdentifier, error });
    }
  }

  console.log(`🎉 Successfully created ${createdMarkets.length} markets`);
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} markets failed`);
  }

  return {
    success: createdMarkets,
    errors,
    total: adjacentMarkets.length,
  };
};

/**
 * Get market by marketId (Sui object ID)
 */
export const getMarket = async (marketId: string) => {
  return await prisma.market.findUnique({
    where: { marketId },
    include: {
      protocol: true,
      bets: true,
      marketResolvedEvent: true,
      yieldDeposits: true,
    },
  });
};

/**
 * Get market by Adjacent ticker
 */
export const getMarketByAdjTicker = async (adjTicker: string) => {
  return await prisma.market.findUnique({
    where: { adjTicker },
    include: {
      protocol: true,
      bets: true,
      marketResolvedEvent: true,
      yieldDeposits: true,
    },
  });
};

/**
 * Get all active markets
 */
export const getActiveMarkets = async () => {
  return await prisma.market.findMany({
    where: { status: 'active' },
    include: {
      protocol: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

/**
 * Get markets by protocol
 */
export const getMarketsByProtocol = async (protocolId: string) => {
  return await prisma.market.findMany({
    where: { protocolId },
    include: {
      protocol: true,
      bets: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

/**
 * Update market from indexer event
 * Called when MarketCreatedEvent is processed
 */
export const syncMarketFromEvent = async (
  marketId: string,
  eventData: any,
  blockchainMarketId?: string
) => {
  console.log(
    `[syncMarketFromEvent] marketId: ${marketId}, blockchainMarketId: ${blockchainMarketId}`
  );

  const existing = await prisma.market.findUnique({
    where: { marketId },
  });

  if (existing) {
    console.log(`✅ Market ${marketId} already synced`);
    return existing;
  }

  const existingByQuestion = await prisma.market.findFirst({
    where: { question: eventData.question },
  });

  const endDateMs = Number(eventData.end_time) * 1000;
  const endDate = new Date(endDateMs);

  console.log(
    `[syncMarketFromEvent] Syncing market with blockchainMarketId: ${blockchainMarketId}`
  );

  const market = existingByQuestion
    ? await prisma.market.update({
        where: { marketId: existingByQuestion.marketId },
        data: {
          blockchainMarketId,
        },
      })
    : await prisma.market.create({
        data: {
          marketId,
          blockchainMarketId,
          question: eventData.question || 'Unknown',
          creator: eventData.creator,
          endDate,
          status: 'active',
        },
      });

  console.log(
    `💾 Synced market from event: ${marketId} with blockchainMarketId: ${blockchainMarketId}`
  );
  return market;
};

/**
 * Update market statistics (volume, bets, etc.)
 */
export const updateMarketStats = async (marketId: string) => {
  const market = await prisma.market.findUnique({
    where: { marketId },
    include: {
      bets: true,
      yieldDeposits: true,
    },
  });

  if (!market) {
    throw new Error(`Market not found: ${marketId}`);
  }

  const totalYesBets = market.bets
    .filter((b) => b.position === true)
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const totalNoBets = market.bets
    .filter((b) => b.position === false)
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const totalYesCount = market.bets.filter((b) => b.position === true).length;

  const totalNoCount = market.bets.filter((b) => b.position === false).length;

  const volume = totalYesBets + totalNoBets;
  const openInterest = volume;
  const totalPoolSize = totalYesBets + totalNoBets;

  let probability = 50;
  if (volume > 0) {
    probability = (totalYesBets / volume) * 100;
  }

  return await prisma.market.update({
    where: { marketId },
    data: {
      totalYesBets: BigInt(totalYesBets),
      totalNoBets: BigInt(totalNoBets),
      totalYesCount,
      totalNoCount,
      totalPoolSize: BigInt(totalPoolSize),
      volume: BigInt(volume),
      openInterest: BigInt(openInterest),
      probability,
    },
  });
};

/**
 * Resolve market
 * Called when MarketResolvedEvent is processed
 */
export const resolveMarket = async (
  marketId: string,
  outcome: boolean,
  totalYieldEarned: bigint
) => {
  return await prisma.market.update({
    where: { marketId },
    data: {
      isResolved: true,
      outcome,
      totalYieldEarned,
      status: 'resolved',
      resolutionDate: new Date(),
    },
  });
};

/**
 * Get market statistics
 */
export const getMarketStats = async (marketId: string) => {
  const market = await prisma.market.findUnique({
    where: { marketId },
    include: {
      bets: true,
      yieldDeposits: true,
      marketResolvedEvent: true,
    },
  });

  if (!market) {
    return null;
  }

  const totalBets = market.bets.length;
  const uniqueBettors = new Set(market.bets.map((b) => b.bettor)).size;
  const totalYieldDeposits = market.yieldDeposits.reduce(
    (sum, d) => sum + Number(d.amount),
    0
  );

  return {
    marketId: market.marketId,
    question: market.question,
    status: market.status,
    probability: market.probability,
    volume: Number(market.volume),
    openInterest: Number(market.openInterest),
    totalYesBets: Number(market.totalYesBets),
    totalNoBets: Number(market.totalNoBets),
    totalYesCount: market.totalYesCount,
    totalNoCount: market.totalNoCount,
    totalPoolSize: Number(market.totalPoolSize),
    totalBets,
    uniqueBettors,
    totalYieldEarned: Number(market.totalYieldEarned),
    totalYieldDeposits,
    isResolved: market.isResolved,
    outcome: market.outcome,
    endDate: market.endDate,
    resolutionDate: market.resolutionDate,
  };
};
