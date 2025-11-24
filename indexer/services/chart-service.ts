import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ChartDataPoint {
  time: number;
  value: number;
}

export interface MarketChartData {
  yesProbability: ChartDataPoint[];
  noProbability: ChartDataPoint[];
  yesVolume: ChartDataPoint[];
  noVolume: ChartDataPoint[];
  totalVolume: ChartDataPoint[];
  yesOdds: ChartDataPoint[];
  noOdds: ChartDataPoint[];
  betCount: ChartDataPoint[];
}

export interface PlatformChartData {
  totalVolume: ChartDataPoint[];
  activeMarkets: ChartDataPoint[];
  totalUsers: ChartDataPoint[];
  totalBets: ChartDataPoint[];
}

const INTERVAL_SECONDS: Record<string, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
  '1w': 604800,
};

function validateInterval(interval: string): number {
  return INTERVAL_SECONDS[interval] || 3600;
}

/**
 * Get market chart data with various time series metrics
 */
export async function getMarketChartData(
  marketId: string,
  interval: string = '1h',
  from?: number,
  to?: number
): Promise<MarketChartData> {
  const intervalSeconds = validateInterval(interval);

  const market = await prisma.market.findUnique({
    where: { marketId },
    select: { createdAt: true },
  });

  if (!market) {
    throw new Error(`Market not found: ${marketId}`);
  }

  const marketCreatedAt = Math.floor(market.createdAt.getTime() / 1000);
  const toTimestamp = to || Math.floor(Date.now() / 1000);
  const fromTimestamp = from || marketCreatedAt;

  const bets = await prisma.bet.findMany({
    where: {
      marketId,
      placedAt: {
        gte: new Date(fromTimestamp * 1000),
        lte: new Date(toTimestamp * 1000),
      },
    },
    select: {
      position: true,
      amount: true,
      placedAt: true,
    },
    orderBy: {
      placedAt: 'asc',
    },
  });

  const startBucket =
    Math.floor(fromTimestamp / intervalSeconds) * intervalSeconds;
  const endBucket = Math.floor(toTimestamp / intervalSeconds) * intervalSeconds;

  interface BucketData {
    yesVolume: number;
    noVolume: number;
    yesCount: number;
    noCount: number;
  }

  const buckets = new Map<number, BucketData>();
  const times: number[] = [];

  for (let t = startBucket; t <= endBucket; t += intervalSeconds) {
    times.push(t);
    buckets.set(t, {
      yesVolume: 0,
      noVolume: 0,
      yesCount: 0,
      noCount: 0,
    });
  }

  for (const bet of bets) {
    const betTimestamp = Math.floor(bet.placedAt.getTime() / 1000);
    const bucketTime =
      Math.floor(betTimestamp / intervalSeconds) * intervalSeconds;
    const bucket = buckets.get(bucketTime);

    if (bucket) {
      const amount = Number(bet.amount);
      if (bet.position) {
        bucket.yesVolume += amount;
        bucket.yesCount++;
      } else {
        bucket.noVolume += amount;
        bucket.noCount++;
      }
    }
  }

  const yesProbability: ChartDataPoint[] = [];
  const noProbability: ChartDataPoint[] = [];
  const yesVolume: ChartDataPoint[] = [];
  const noVolume: ChartDataPoint[] = [];
  const totalVolume: ChartDataPoint[] = [];
  const yesOdds: ChartDataPoint[] = [];
  const noOdds: ChartDataPoint[] = [];
  const betCount: ChartDataPoint[] = [];

  let runningYesTotal = 0;
  let runningNoTotal = 0;

  for (const t of times) {
    const bucket = buckets.get(t)!;

    runningYesTotal += bucket.yesVolume;
    runningNoTotal += bucket.noVolume;

    const total = runningYesTotal + runningNoTotal;

    let yesProbVal = 0.5;
    let noProbVal = 0.5;
    if (total > 0) {
      yesProbVal = runningYesTotal / total;
      noProbVal = runningNoTotal / total;
    }

    let yesOddsVal = 2.0;
    let noOddsVal = 2.0;
    if (yesProbVal > 0 && yesProbVal < 1) {
      yesOddsVal = 1.0 / yesProbVal;
      noOddsVal = 1.0 / noProbVal;
    }

    yesProbability.push({ time: t, value: yesProbVal });
    noProbability.push({ time: t, value: noProbVal });
    yesVolume.push({ time: t, value: runningYesTotal });
    noVolume.push({ time: t, value: runningNoTotal });
    totalVolume.push({ time: t, value: total });
    yesOdds.push({ time: t, value: yesOddsVal });
    noOdds.push({ time: t, value: noOddsVal });
    betCount.push({ time: t, value: bucket.yesCount + bucket.noCount });
  }

  return {
    yesProbability,
    noProbability,
    yesVolume,
    noVolume,
    totalVolume,
    yesOdds,
    noOdds,
    betCount,
  };
}

/**
 * Get platform-wide chart data
 */
export async function getPlatformChartData(
  days: number = 30
): Promise<PlatformChartData> {
  const now = new Date();
  const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const intervalSeconds = 86400;

  const times: number[] = [];
  const startTimestamp = Math.floor(startTime.getTime() / 1000);
  const nowTimestamp = Math.floor(now.getTime() / 1000);

  for (let t = startTimestamp; t <= nowTimestamp; t += intervalSeconds) {
    times.push(t);
  }

  const totalVolume: ChartDataPoint[] = [];
  const activeMarkets: ChartDataPoint[] = [];
  const totalUsers: ChartDataPoint[] = [];
  const totalBets: ChartDataPoint[] = [];

  for (const t of times) {
    const endOfDay = new Date((t + intervalSeconds) * 1000);

    const volumeResult = await prisma.bet.aggregate({
      where: {
        placedAt: {
          lte: endOfDay,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const volume = Number(volumeResult._sum.amount || 0);
    totalVolume.push({ time: t, value: volume });

    const marketsCount = await prisma.market.count({
      where: {
        createdAt: {
          lte: endOfDay,
        },
      },
    });
    activeMarkets.push({ time: t, value: marketsCount });

    const usersResult = await prisma.bet.findMany({
      where: {
        placedAt: {
          lte: endOfDay,
        },
      },
      select: {
        bettor: true,
      },
      distinct: ['bettor'],
    });
    totalUsers.push({ time: t, value: usersResult.length });

    const betsCount = await prisma.bet.count({
      where: {
        placedAt: {
          lte: endOfDay,
        },
      },
    });
    totalBets.push({ time: t, value: betsCount });
  }

  return {
    totalVolume,
    activeMarkets,
    totalUsers,
    totalBets,
  };
}

/**
 * Get simple market probability over time
 */
export async function getMarketProbability(
  marketId: string,
  points: number = 50
): Promise<ChartDataPoint[]> {
  const market = await prisma.market.findUnique({
    where: { marketId },
    include: {
      bets: {
        orderBy: {
          placedAt: 'asc',
        },
      },
    },
  });

  if (!market || market.bets.length === 0) {
    return [];
  }

  const totalBets = market.bets.length;
  const step = Math.max(1, Math.floor(totalBets / points));

  const probability: ChartDataPoint[] = [];
  let yesTotal = 0;
  let noTotal = 0;

  for (let i = 0; i < totalBets; i++) {
    const bet = market.bets[i];
    const amount = Number(bet.amount);

    if (bet.position) {
      yesTotal += amount;
    } else {
      noTotal += amount;
    }

    if (i % step === 0 || i === totalBets - 1) {
      const total = yesTotal + noTotal;
      const prob = total > 0 ? yesTotal / total : 0.5;
      const timestamp = Math.floor(bet.placedAt.getTime() / 1000);

      probability.push({ time: timestamp, value: prob });
    }
  }

  return probability;
}

/**
 * Get market volume over time
 */
export async function getMarketVolume(
  marketId: string,
  interval: string = '1d'
): Promise<ChartDataPoint[]> {
  const intervalSeconds = validateInterval(interval);

  const market = await prisma.market.findUnique({
    where: { marketId },
    select: { createdAt: true },
  });

  if (!market) {
    throw new Error(`Market not found: ${marketId}`);
  }

  const startTime = Math.floor(market.createdAt.getTime() / 1000);
  const endTime = Math.floor(Date.now() / 1000);

  const bets = await prisma.bet.findMany({
    where: { marketId },
    select: {
      amount: true,
      placedAt: true,
    },
    orderBy: {
      placedAt: 'asc',
    },
  });

  const buckets = new Map<number, number>();
  const times: number[] = [];

  for (let t = startTime; t <= endTime; t += intervalSeconds) {
    times.push(t);
    buckets.set(t, 0);
  }

  let runningTotal = 0;
  for (const bet of bets) {
    const betTime = Math.floor(bet.placedAt.getTime() / 1000);
    const bucketTime = Math.floor(betTime / intervalSeconds) * intervalSeconds;
    runningTotal += Number(bet.amount);

    if (buckets.has(bucketTime)) {
      buckets.set(bucketTime, runningTotal);
    }
  }

  return times.map((t) => ({
    time: t,
    value: buckets.get(t) || 0,
  }));
}

/**
 * Get top markets by volume
 */
export async function getTopMarkets(limit: number = 10) {
  return await prisma.market.findMany({
    where: {
      status: 'active',
    },
    orderBy: {
      volume: 'desc',
    },
    take: limit,
    include: {
      protocol: true,
      _count: {
        select: {
          bets: true,
        },
      },
    },
  });
}

/**
 * Get user betting history chart
 */
export async function getUserBettingHistory(
  userAddress: string
): Promise<ChartDataPoint[]> {
  const bets = await prisma.bet.findMany({
    where: {
      bettor: userAddress,
    },
    orderBy: {
      placedAt: 'asc',
    },
    select: {
      amount: true,
      placedAt: true,
    },
  });

  let cumulative = 0;
  return bets.map((bet) => {
    cumulative += Number(bet.amount);
    return {
      time: Math.floor(bet.placedAt.getTime() / 1000),
      value: cumulative,
    };
  });
}
