import { prisma } from '../db';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION_MS = 3600 * 1000;

interface CoinGeckoPriceData {
  sui: {
    usd: number;
    usd_market_cap: number;
    usd_24h_vol: number;
    usd_24h_change: number;
  };
}

/**
 * Fetch SUI/USD price from CoinGecko API
 */
async function fetchSuiPriceFromCoinGecko(): Promise<CoinGeckoPriceData> {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=sui&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from CoinGecko:', error);
    throw error;
  }
}

/**
 * Get the latest SUI/USD price from cache or fetch from CoinGecko
 */
export async function getLatestSuiPrice(forceRefresh = false) {
  try {
    if (!forceRefresh) {
      const cachedPrice = await prisma.price.findUnique({
        where: {
          symbol_currency: {
            symbol: 'SUI',
            currency: 'USD',
          },
        },
      });

      if (cachedPrice) {
        const ageMs = Date.now() - cachedPrice.fetchedAt.getTime();
        if (ageMs < CACHE_DURATION_MS) {
          console.log(`✅ Using cached SUI/USD price: $${cachedPrice.price}`);
          return cachedPrice;
        }
      }
    }

    console.log('🔄 Fetching SUI/USD price from CoinGecko...');
    const data = await fetchSuiPriceFromCoinGecko();

    const suiData = data.sui;
    const price = suiData.usd;
    const marketCap = suiData.usd_market_cap
      ? BigInt(Math.floor(suiData.usd_market_cap))
      : null;
    const volume24h = suiData.usd_24h_vol
      ? BigInt(Math.floor(suiData.usd_24h_vol))
      : null;
    const change24h = suiData.usd_24h_change;

    const updatedPrice = await prisma.price.upsert({
      where: {
        symbol_currency: {
          symbol: 'SUI',
          currency: 'USD',
        },
      },
      update: {
        price,
        marketCap,
        volume24h,
        change24h,
        fetchedAt: new Date(),
      },
      create: {
        symbol: 'SUI',
        currency: 'USD',
        price,
        marketCap,
        volume24h,
        change24h,
        fetchedAt: new Date(),
      },
    });

    console.log(`✅ Updated SUI/USD price: $${updatedPrice.price}`);
    return updatedPrice;
  } catch (error) {
    console.error('Error getting SUI price:', error);

    const stalePrice = await prisma.price.findUnique({
      where: {
        symbol_currency: {
          symbol: 'SUI',
          currency: 'USD',
        },
      },
    });
    if (stalePrice) {
      console.log(`⚠️  Using stale cached price: $${stalePrice.price}`);
      return stalePrice;
    }
    throw error;
  }
}

/**
 * Get multiple token prices
 */
export async function getMultiplePrices(symbols: string[], currency = 'USD') {
  const prices = await prisma.price.findMany({
    where: {
      symbol: {
        in: symbols.map((s) => s.toUpperCase()),
      },
      currency,
    },
  });

  return prices;
}

/**
 * Start periodic price updates
 */
export function startPriceUpdater(intervalMs = 3600 * 1000) {
  console.log('🚀 Starting SUI price updater...');

  getLatestSuiPrice(true).catch((err) => {
    console.error('Failed to fetch initial price:', err);
  });

  setInterval(() => {
    getLatestSuiPrice(true).catch((err) => {
      console.error('Failed to update price:', err);
    });
  }, intervalMs);
}
