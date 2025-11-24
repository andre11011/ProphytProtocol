import dotend from 'dotenv';

dotend.config();

const DEFAULT_API_BASE_URL = 'https://api.data.adj.news/api';

export interface StatusDetails {
  isActive: boolean;
}

export interface AdjacentMarket {
  market_id?: string;
  platform_id?: string;
  ticker?: string;
  adj_ticker?: string;
  adjTicker?: string;
  marketId?: string;
  platform?: string;
  market_type?: string;
  question: string;
  description?: string;
  rules?: string;
  status?: string;
  statusDetails?: StatusDetails;
  probability?: number;
  volume?: number;
  openInterest?: number;
  end_date?: string;
  endDate?: string;
  resolution_date?: string;
  resolutionDate?: string;
  result?: boolean;
  link?: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ApiMeta {
  count: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  totalFetched?: number;
  efficiency?: number;
}

export interface AdjacentApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

type FetchParams = Record<string, string | number>;

const buildUrl = (endpoint: string, params?: FetchParams): string => {
  const baseUrl = process.env.ADJACENT_API_BASE_URL || DEFAULT_API_BASE_URL;
  const url = new URL(`${baseUrl}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
};

const createHeaders = (apiKey: string): HeadersInit => ({
  Authorization: `Bearer ${process.env.ADJACENT_API_KEY || apiKey}`,
  'Content-Type': 'application/json',
});

const fetchFromAdjacent = async <T>(
  apiKey: string,
  endpoint: string,
  params?: FetchParams
): Promise<T> => {
  const url = buildUrl(endpoint, params);
  const response = await fetch(url, {
    headers: createHeaders(apiKey),
  });

  if (!response.ok) {
    throw new Error(`Adjacent API returned error: ${response.status}`);
  }

  return response.json();
};

const normalizeMarket = (apiMarket): AdjacentMarket => {
  return {
    adjTicker: apiMarket.adj_ticker || apiMarket.adjTicker,
    marketId:
      apiMarket.market_id || apiMarket.platform_id || apiMarket.marketId,
    question: apiMarket.question,
    description: apiMarket.description,
    rules: apiMarket.rules,
    status: apiMarket.status || 'active',
    probability: apiMarket.probability || 50,
    platform: apiMarket.platform || 'unknown',
    volume: apiMarket.volume || 0,
    openInterest: apiMarket.openInterest || 0,
    endDate: apiMarket.end_date || apiMarket.endDate,
    resolutionDate: apiMarket.resolution_date || apiMarket.resolutionDate,
    link: apiMarket.url || apiMarket.link,
    createdAt: apiMarket.createdAt,
    updatedAt: apiMarket.updatedAt,
  };
};

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const validateMarket = (market: AdjacentMarket): boolean => {
  if (!market.question) {
    return false;
  }

  if (!market.endDate || !isValidDate(market.endDate)) {
    return false;
  }

  return true;
};

const isQualityMarket = (
  market: AdjacentMarket,
  minDescLength: number
): boolean => {
  if (!market.question?.trim()) return false;

  if ((market.description?.trim().length || 0) <= minDescLength) return false;

  if (market.status?.toLowerCase() !== 'active') return false;

  if (market.probability < 20 || market.probability > 80) return false;

  return true;
};

const filterQualityMarkets = (
  markets: AdjacentMarket[],
  minDescLength: number
): AdjacentMarket[] => {
  return markets.filter((m) => isQualityMarket(m, minDescLength));
};

const logFetch = (attempt: number, batchSize: number, offset: number): void => {
  console.info(
    `📡 Batch ${attempt}: Fetching ${batchSize} markets (offset ${offset})`
  );
};

const logProgress = (
  filtered: number,
  current: number,
  target: number
): void => {
  console.info(`✅ Found ${filtered} quality markets (${current}/${target})`);
};

const logFinal = (
  count: number,
  target: number,
  total: number,
  efficiency: number
): void => {
  console.info(
    `🎉 Final result: ${count}/${target} quality markets from ${total} fetched (${efficiency}% efficiency)`
  );
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const calculateEfficiency = (count: number, totalFetched: number): number => {
  return totalFetched > 0 ? Math.round((count / totalFetched) * 100) : 0;
};

export const getMarkets = (
  apiKey: string,
  limit: number,
  offset: number,
  sortBy: string,
  sortDir: string
): Promise<AdjacentApiResponse<AdjacentMarket[]>> => {
  return fetchFromAdjacent(apiKey, '/markets', {
    limit,
    offset,
    sort_by: sortBy,
    sort_dir: sortDir,
  });
};

export const getMarket = (
  apiKey: string,
  adjTicker: string
): Promise<AdjacentApiResponse<AdjacentMarket>> => {
  return fetchFromAdjacent(apiKey, `/markets/${adjTicker}`);
};

export const getQualityMarkets = async (
  apiKey: string,
  targetCount: number,
  minDescLength: number
): Promise<AdjacentApiResponse<AdjacentMarket[]>> => {
  console.info(
    `🎯 Targeting ${targetCount} quality markets (active + desc > ${minDescLength} chars)`
  );

  const qualityMarkets: AdjacentMarket[] = [];
  let offset = 0;
  const batchSize = 50;
  let totalFetched = 0;
  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (qualityMarkets.length >= targetCount) break;

    logFetch(attempt, batchSize, offset);

    const batch = await fetchFromAdjacent<
      AdjacentApiResponse<AdjacentMarket[]>
    >(apiKey, '/markets', {
      limit: batchSize,
      offset,
      sort: 'updated_at:desc',
      platform: 'polymarket',
      market_type: 'binary',
      status: 'active',
    });

    if (batch.data.length === 0) {
      console.warn('⚠️ No more markets available from API');
      break;
    }

    totalFetched += batch.data.length;

    const normalizedMarkets = batch.data.map(normalizeMarket);
    const filtered = filterQualityMarkets(normalizedMarkets, minDescLength);
    qualityMarkets.push(...filtered);

    logProgress(filtered.length, qualityMarkets.length, targetCount);

    offset += batchSize;
    if (attempt < maxAttempts) {
      await delay(500);
    }
  }

  const count = qualityMarkets.length;
  const efficiency = calculateEfficiency(count, totalFetched);

  logFinal(count, targetCount, totalFetched, efficiency);

  return {
    data: qualityMarkets.slice(0, targetCount),
    meta: {
      count,
      limit: targetCount,
      offset: 0,
      hasMore: false,
      totalFetched,
      efficiency,
    },
  };
};

export const getExactQualityMarkets = async (
  apiKey: string,
  targetCount: number
): Promise<AdjacentApiResponse<AdjacentMarket[]>> => {
  console.info(`🎯 Attempting to find ${targetCount} quality markets...`);

  const attempts = [
    { minDescLength: 20, label: '20+ chars' },
    { minDescLength: 50, label: '50+ chars' },
    { minDescLength: 20, label: '20+ chars again' },
    { minDescLength: 0, label: 'any active markets' },
  ];

  let result = await getQualityMarkets(
    apiKey,
    targetCount,
    attempts[0].minDescLength
  );

  for (
    let i = 1;
    i < attempts.length && result.data.length < targetCount;
    i++
  ) {
    console.info(
      `🔄 Found ${result.data.length}/${targetCount}, retry with ${attempts[i].label}...`
    );
    result = await getQualityMarkets(
      apiKey,
      targetCount,
      attempts[i].minDescLength
    );
  }

  return result;
};
