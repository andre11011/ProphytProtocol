/**
 * Market Resolution Scheduler
 *
 * Periodically checks for expired markets and resolves them using Nautilus
 */

import { autoResolveExpiredMarkets } from './market-resolution-service';

const RESOLUTION_CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

/**
 * Start the market resolution scheduler
 */
export function startMarketResolutionScheduler(): void {
  if (isRunning) {
    console.log('⚠️  Market resolution scheduler is already running');
    return;
  }

  console.log('🚀 Starting market resolution scheduler...');
  isRunning = true;

  // Run immediately on start
  autoResolveExpiredMarkets().catch((error) => {
    console.error('❌ Error in initial market resolution check:', error);
  });

  // Then run periodically
  intervalId = setInterval(() => {
    autoResolveExpiredMarkets().catch((error) => {
      console.error('❌ Error in scheduled market resolution:', error);
    });
  }, RESOLUTION_CHECK_INTERVAL_MS);

  console.log(
    `✅ Market resolution scheduler started (checking every ${RESOLUTION_CHECK_INTERVAL_MS / 1000}s)`
  );
}

/**
 * Stop the market resolution scheduler
 */
export function stopMarketResolutionScheduler(): void {
  if (!isRunning) {
    return;
  }

  console.log('🛑 Stopping market resolution scheduler...');
  isRunning = false;

  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  console.log('✅ Market resolution scheduler stopped');
}
