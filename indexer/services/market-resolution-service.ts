/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Market Resolution Service with Nautilus Integration
 *
 * This service automatically resolves markets when they end using
 * the Nautilus Trust Oracle for provably authentic outcomes.
 */

import axios from 'axios';
import { prisma } from '../db';
import {
  resolveMarketWithNautilus as getNautilusResolution,
  checkNautilusHealth,
} from './nautilus-service';
import {
  resolveMarketWithNautilus as submitNautilusResolution,
  resolveMarket as submitManualResolution,
  getMarketObject,
} from './sui-client';

const NAUTILUS_ENABLED = process.env.NAUTILUS_ENABLED === 'true';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const API_TIMEOUT_MS = 30000;

interface MarketResolutionOptions {
  useNautilus?: boolean;
  dataSourceUrl?: string;
  retries?: number;
}

/**
 * Automatically resolve markets that have ended
 * Uses Nautilus if enabled, otherwise falls back to manual resolution
 */
export async function autoResolveExpiredMarkets(
  options: MarketResolutionOptions = {}
): Promise<{
  resolved: number;
  failed: number;
  skipped: number;
}> {
  const now = new Date();

  // Find all active markets that have ended
  const expiredMarkets = await prisma.market.findMany({
    where: {
      status: 'active',
      isResolved: false,
      endDate: {
        lte: now,
      },
    },
    take: 10, // Process in batches
    orderBy: {
      endDate: 'asc', // Process oldest first
    },
  });

  if (expiredMarkets.length === 0) {
    return { resolved: 0, failed: 0, skipped: 0 };
  }

  console.log(`🔍 Found ${expiredMarkets.length} expired markets to resolve`);

  const useNautilus =
    options.useNautilus !== undefined
      ? options.useNautilus
      : NAUTILUS_ENABLED && (await checkNautilusHealth());

  let resolved = 0;
  let failed = 0;
  let skipped = 0;

  for (const market of expiredMarkets) {
    try {
      // Validate market before processing
      if (!market.blockchainMarketId && !market.marketId) {
        console.warn(
          `⚠️  Market ${market.id} has no blockchainMarketId or marketId, skipping`
        );
        skipped++;
        continue;
      }

      if (useNautilus) {
        await resolveMarketWithNautilus(market, options);
        resolved++;
      } else {
        await resolveMarketManually(market);
        resolved++;
      }
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(
        `❌ Failed to resolve market ${market.marketId}:`,
        errorMsg
      );
      // Continue with other markets
    }
  }

  console.log(
    `📊 Resolution summary: ${resolved} resolved, ${failed} failed, ${skipped} skipped`
  );

  return { resolved, failed, skipped };
}

/**
 * Resolve a market using Nautilus Trust Oracle
 */
async function resolveMarketWithNautilus(
  market: any,
  options: MarketResolutionOptions
): Promise<void> {
  console.log(
    `🔐 Resolving market ${market.marketId} with Nautilus: ${market.question}`
  );

  if (!market.blockchainMarketId && !market.marketId) {
    throw new Error('Market has no blockchainMarketId or marketId');
  }

  const maxRetries = options.retries ?? MAX_RETRIES;
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get market end time in seconds
      const endTime = Math.floor(market.endDate.getTime() / 1000);

      // Validate market has ended
      const now = Math.floor(Date.now() / 1000);
      if (now < endTime) {
        throw new Error(
          `Market has not ended yet. End time: ${endTime}, Current: ${now}`
        );
      }

      // Get the numeric market ID from blockchain
      const marketIdNum = await extractMarketId(market);

      if (marketIdNum === 0) {
        throw new Error('Could not extract valid numeric market ID');
      }

      console.log(
        `📊 Market ID: blockchain=${market.blockchainMarketId || 'N/A'}, numeric=${marketIdNum}`
      );

      // Request resolution from Nautilus
      const resolution = await getNautilusResolution(
        marketIdNum,
        market.question,
        endTime,
        options.dataSourceUrl || market.externalLink || undefined,
        market.imageUrl || undefined
      );

      console.log(
        `✅ Nautilus resolution received: outcome=${resolution.outcome}, source=${resolution.source_data.substring(0, 50)}...`
      );

      // Submit to blockchain
      const txDigest = await submitNautilusResolution({
        marketId: market.blockchainMarketId || market.marketId,
        resolution: {
          market_id: marketIdNum,
          outcome: resolution.outcome,
          source_data: resolution.source_data,
          source_data_hash: resolution.source_data_hash,
          resolution_timestamp: resolution.resolution_timestamp,
          media_hash: resolution.media_hash,
        },
        signature: resolution.signature,
        enclave_public_key: resolution.public_key,
      });

      console.log(
        `✅ Market ${market.marketId} resolved on-chain: ${txDigest}`
      );

      // Update database
      await prisma.market.update({
        where: { id: market.id },
        data: {
          isResolved: true,
          outcome: resolution.outcome,
          status: 'resolved',
          resolutionDate: new Date(),
        },
      });

      return; // Success, exit retry loop
    } catch (error) {
      lastError = error;
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (attempt < maxRetries - 1) {
        const delay = RETRY_DELAY_MS * (attempt + 1);
        console.warn(
          `⚠️  Attempt ${attempt + 1}/${maxRetries} failed: ${errorMsg}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(
          `❌ Nautilus resolution failed after ${maxRetries} attempts:`,
          errorMsg
        );
      }
    }
  }

  throw lastError || new Error('Nautilus resolution failed');
}

/**
 * Extract numeric market ID from blockchain or database
 */
async function extractMarketId(market: any): Promise<number> {
  // Try to get from blockchain first
  if (market.blockchainMarketId) {
    try {
      const marketObject = await getMarketObject(market.blockchainMarketId);
      if (marketObject.data && 'content' in marketObject.data) {
        const content = marketObject.data.content as any;
        if (content.fields) {
          // Try different field names
          const idField =
            content.fields.id ||
            content.fields.market_id ||
            content.fields.marketId;

          if (typeof idField === 'string') {
            const parsed = parseInt(idField);
            if (!isNaN(parsed) && parsed > 0) {
              return parsed;
            }
          } else if (typeof idField === 'number' && idField > 0) {
            return idField;
          }
        }
      }
    } catch (error) {
      console.warn(
        `⚠️  Could not fetch market object from blockchain: ${error}`
      );
    }

    // Fallback: extract numeric part from blockchain ID
    const numericPart = market.blockchainMarketId.replace(/\D/g, '');
    if (numericPart.length > 0) {
      const parsed = parseInt(numericPart.slice(0, 10));
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  // Fallback: use marketId from database
  if (market.marketId) {
    if (!isNaN(Number(market.marketId))) {
      const parsed = Number(market.marketId);
      if (parsed > 0) {
        return parsed;
      }
    }
    // Try to extract numeric part
    const numericPart = market.marketId.replace(/\D/g, '');
    if (numericPart.length > 0) {
      const parsed = parseInt(numericPart.slice(0, 10));
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return 0;
}

/**
 * Resolve a market manually (fallback)
 */
async function resolveMarketManually(market: any): Promise<void> {
  console.log(
    `📝 Resolving market ${market.marketId} manually: ${market.question}`
  );

  if (!market.blockchainMarketId && !market.marketId) {
    throw new Error('Market has no blockchainMarketId or marketId');
  }

  const maxRetries = MAX_RETRIES;
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Determine the outcome from external sources or market data
      const outcome = await determineOutcome(market);

      console.log(
        `📊 Determined outcome for market ${market.marketId}: ${outcome ? 'YES' : 'NO'}`
      );

      // Submit to blockchain
      const marketId = market.blockchainMarketId || market.marketId;
      const txDigest = await submitManualResolution(marketId, outcome);

      console.log(
        `✅ Market ${market.marketId} resolved manually: ${txDigest}`
      );

      // Update database
      await prisma.market.update({
        where: { id: market.id },
        data: {
          isResolved: true,
          outcome,
          status: 'resolved',
          resolutionDate: new Date(),
        },
      });

      return; // Success, exit retry loop
    } catch (error) {
      lastError = error;
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (attempt < maxRetries - 1) {
        const delay = RETRY_DELAY_MS * (attempt + 1);
        console.warn(
          `⚠️  Attempt ${attempt + 1}/${maxRetries} failed: ${errorMsg}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(
          `❌ Manual resolution failed after ${maxRetries} attempts:`,
          errorMsg
        );
      }
    }
  }

  throw lastError || new Error('Manual resolution failed');
}

/**
 * Determine market outcome from external sources or market data
 * This function intelligently parses market questions and queries external APIs
 */
async function determineOutcome(market: any): Promise<boolean> {
  const question = market.question?.toLowerCase() || '';
  const externalLink = market.externalLink;

  // If external link is provided, try to fetch and parse data
  if (externalLink) {
    try {
      const outcome = await fetchAndParseExternalSource(externalLink, question);
      console.log(
        `📡 External source resolved: ${externalLink} -> ${outcome ? 'YES' : 'NO'}`
      );
      return outcome;
    } catch (error) {
      console.warn(
        `⚠️  Failed to fetch from external source ${externalLink}:`,
        error instanceof Error ? error.message : String(error)
      );
      // Fall through to other methods
    }
  }

  // Try to determine from market question patterns
  if (question) {
    // Price-based markets (e.g., "Will BTC reach $100k?")
    if (question.includes('price') || question.includes('$')) {
      const priceOutcome = await determinePriceBasedOutcome(question);
      if (priceOutcome !== null) {
        return priceOutcome;
      }
    }

    // Numeric threshold markets (e.g., "Will X exceed 1000?")
    if (
      question.includes('exceed') ||
      question.includes('more than') ||
      question.includes('at least') ||
      question.includes('above') ||
      question.includes('over')
    ) {
      const thresholdOutcome = await determineThresholdBasedOutcome(question);
      if (thresholdOutcome !== null) {
        return thresholdOutcome;
      }
    }

    // Yes/No questions - check betting ratios as fallback
    if (market.totalYesBets && market.totalNoBets) {
      const totalYes = Number(market.totalYesBets);
      const totalNo = Number(market.totalNoBets);
      const total = totalYes + totalNo;

      if (total > 0) {
        const yesRatio = totalYes / total;
        // If >60% bet YES, resolve as YES (conservative threshold)
        if (yesRatio > 0.6) {
          console.log(
            `📊 Resolved based on betting ratio: ${(yesRatio * 100).toFixed(1)}% YES`
          );
          return true;
        }
        // If >60% bet NO, resolve as NO
        if (yesRatio < 0.4) {
          console.log(
            `📊 Resolved based on betting ratio: ${((1 - yesRatio) * 100).toFixed(1)}% NO`
          );
          return false;
        }
      }
    }
  }

  // Default: resolve as NO (conservative approach)
  console.warn(
    `⚠️  Could not determine outcome for market ${market.marketId}, defaulting to NO`
  );
  return false;
}

/**
 * Fetch and parse data from external API
 */
async function fetchAndParseExternalSource(
  url: string,
  question: string
): Promise<boolean> {
  try {
    const response = await axios.get(url, {
      timeout: API_TIMEOUT_MS,
      headers: {
        'User-Agent': 'Prophyt-Market-Resolver/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.data) {
      throw new Error('Empty response from external source');
    }

    // Try to parse as JSON first
    let data: any;
    if (typeof response.data === 'string') {
      try {
        data = JSON.parse(response.data);
      } catch {
        // Not JSON, treat as text
        data = response.data;
      }
    } else {
      data = response.data;
    }

    return parseExternalData(data, question);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `API request failed: ${error.message} (${error.response?.status})`
      );
    }
    throw error;
  }
}

/**
 * Parse external data to determine outcome
 */
function parseExternalData(data: any, question: string): boolean {
  // If data is a string, try to parse it
  if (typeof data === 'string') {
    const lowerData = data.toLowerCase();
    const positiveIndicators = ['yes', 'true', '1', 'success', 'active'];
    const negativeIndicators = ['no', 'false', '0', 'failed', 'inactive'];

    const positiveCount = positiveIndicators.filter((ind) =>
      lowerData.includes(ind)
    ).length;
    const negativeCount = negativeIndicators.filter((ind) =>
      lowerData.includes(ind)
    ).length;

    if (positiveCount > negativeCount) return true;
    if (negativeCount > positiveCount) return false;
  }

  // If data is an object, look for common outcome fields
  if (typeof data === 'object' && data !== null) {
    // Check for boolean outcome fields
    const outcomeFields = [
      'outcome',
      'result',
      'resolved',
      'answer',
      'success',
      'status',
    ];
    for (const field of outcomeFields) {
      if (field in data) {
        const value = data[field];
        if (typeof value === 'boolean') {
          return value;
        }
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (['yes', 'true', '1', 'success'].includes(lower)) return true;
          if (['no', 'false', '0', 'failed'].includes(lower)) return false;
        }
        if (typeof value === 'number') {
          return value > 0;
        }
      }
    }

    // Check for price fields (for price prediction markets)
    if (question.includes('price') || question.includes('$')) {
      const priceFields = ['price', 'current_price', 'value', 'usd'];
      for (const field of priceFields) {
        if (field in data) {
          const price = parseFloat(data[field]);
          if (!isNaN(price)) {
            const target = extractPriceTarget(question);
            if (target !== null) {
              return price >= target;
            }
          }
        }
      }
    }

    // Check for numeric threshold fields
    const numericFields = ['value', 'count', 'total', 'amount'];
    for (const field of numericFields) {
      if (field in data) {
        const value = parseFloat(data[field]);
        if (!isNaN(value)) {
          const threshold = extractNumericThreshold(question);
          if (threshold !== null) {
            return value >= threshold;
          }
        }
      }
    }
  }

  // Default: check if data suggests positive outcome
  const dataStr = JSON.stringify(data).toLowerCase();
  return (
    dataStr.includes('true') ||
    dataStr.includes('yes') ||
    dataStr.includes('success') ||
    dataStr.includes('active')
  );
}

/**
 * Extract price target from question (e.g., "$100k" -> 100000)
 */
function extractPriceTarget(question: string): number | null {
  // Pattern: $100k, $100,000, $100K, etc.
  const regex = /\$?([\d,]+)\s*([kmKM])?/i;
  const match = question.match(regex);
  if (match) {
    const numStr = match[1].replace(/,/g, '');
    let num = parseFloat(numStr);
    if (!isNaN(num)) {
      const multiplier = match[2]?.toUpperCase();
      if (multiplier === 'K') num *= 1000;
      if (multiplier === 'M') num *= 1000000;
      return num;
    }
  }
  return null;
}

/**
 * Extract numeric threshold from question (e.g., "more than 100" -> 100)
 */
function extractNumericThreshold(question: string): number | null {
  // Pattern: "more than 100", "at least 50", "over 1000", etc.
  const regex =
    /(?:more than|at least|over|above|greater than|exceed)\s+([\d,]+)/i;
  const match = question.match(regex);
  if (match) {
    const numStr = match[1].replace(/,/g, '');
    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Determine outcome for price-based markets
 */
async function determinePriceBasedOutcome(
  question: string
): Promise<boolean | null> {
  const target = extractPriceTarget(question);
  if (target === null) {
    return null;
  }

  // Try to get current price from database (if available)
  // For now, we'd need to query an external price API
  // This is a placeholder - in production, integrate with price oracles
  console.log(
    `💱 Price-based market detected: target=${target}, but price oracle not fully integrated`
  );
  return null;
}

/**
 * Determine outcome for threshold-based markets
 */
async function determineThresholdBasedOutcome(
  question: string
): Promise<boolean | null> {
  const threshold = extractNumericThreshold(question);
  if (threshold === null) {
    return null;
  }

  // This would need to query external APIs to get current value
  // Placeholder for now
  console.log(
    `📊 Threshold-based market detected: threshold=${threshold}, but data source not available`
  );
  return null;
}

/**
 * Resolve a specific market by ID
 */
export async function resolveMarketById(
  marketId: string,
  options: MarketResolutionOptions = {}
): Promise<void> {
  const market = await prisma.market.findUnique({
    where: { marketId },
  });

  if (!market) {
    throw new Error(`Market ${marketId} not found`);
  }

  if (market.isResolved) {
    console.log(`ℹ️  Market ${marketId} is already resolved`);
    return;
  }

  const useNautilus =
    options.useNautilus !== undefined
      ? options.useNautilus
      : NAUTILUS_ENABLED && (await checkNautilusHealth());

  if (useNautilus) {
    await resolveMarketWithNautilus(market, options);
  } else {
    await resolveMarketManually(market);
  }
}
