import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import {
  resolveMarketById,
  autoResolveExpiredMarkets,
} from '../services/market-resolution-service';
import { checkNautilusHealth } from '../services/nautilus-service';
import axios from 'axios';

const router = Router();

const NAUTILUS_SERVER_URL =
  process.env.NAUTILUS_SERVER_URL || 'http://localhost:8080';

/**
 * GET /api/nautilus/health
 * Check Nautilus server health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await checkNautilusHealth();
    res.json({
      success: true,
      data: {
        healthy: isHealthy,
        serverUrl: NAUTILUS_SERVER_URL,
        enabled: process.env.NAUTILUS_ENABLED === 'true',
      },
    });
  } catch (error) {
    console.error('Error checking Nautilus health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Nautilus health',
    });
  }
});

/**
 * GET /api/nautilus/pending-markets
 * Get markets pending resolution from Nautilus server
 */
router.get('/pending-markets', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${NAUTILUS_SERVER_URL}/markets/pending`, {
      timeout: 5000,
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error('Error fetching pending markets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending markets from Nautilus',
    });
  }
});

/**
 * GET /api/nautilus/resolutions
 * Get resolution history from database
 */
router.get('/resolutions', async (req: Request, res: Response) => {
  try {
    const { marketId, limit = 50, offset = 0 } = req.query;

    let resolutions;
    if (marketId) {
      resolutions = await prisma.$queryRaw`
        SELECT 
          market_id,
          outcome,
          source_data,
          source_data_hash,
          resolution_timestamp,
          media_hash,
          signature,
          public_key,
          created_at
        FROM nautilus_resolutions
        WHERE market_id = ${String(marketId)}
        ORDER BY created_at DESC
        LIMIT ${Number(limit)}
        OFFSET ${Number(offset)}
      `;
    } else {
      resolutions = await prisma.$queryRaw`
        SELECT 
          market_id,
          outcome,
          source_data,
          source_data_hash,
          resolution_timestamp,
          media_hash,
          signature,
          public_key,
          created_at
        FROM nautilus_resolutions
        ORDER BY created_at DESC
        LIMIT ${Number(limit)}
        OFFSET ${Number(offset)}
      `;
    }

    res.json({
      success: true,
      data: resolutions,
    });
  } catch (error) {
    console.error('Error fetching resolutions:', error);
    // If table doesn't exist yet, return empty array
    if (error instanceof Error && error.message.includes('does not exist')) {
      res.json({
        success: true,
        data: [],
        message: 'Nautilus resolutions table not initialized yet',
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resolutions',
    });
  }
});

/**
 * POST /api/nautilus/resolve/:marketId
 * Manually trigger market resolution using Nautilus
 */
router.post('/resolve/:marketId', async (req: Request, res: Response) => {
  try {
    const { marketId } = req.params;
    const { useNautilus, dataSourceUrl } = req.body;

    await resolveMarketById(marketId, {
      useNautilus: useNautilus !== undefined ? useNautilus : true,
      dataSourceUrl,
    });

    res.json({
      success: true,
      message: `Market ${marketId} resolution initiated`,
    });
  } catch (error) {
    console.error('Error resolving market with Nautilus:', error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to resolve market',
    });
  }
});

/**
 * POST /api/nautilus/resolve-all
 * Trigger resolution for all expired markets
 */
router.post('/resolve-all', async (req: Request, res: Response) => {
  try {
    const { useNautilus } = req.body;

    await autoResolveExpiredMarkets({
      useNautilus: useNautilus !== undefined ? useNautilus : true,
    });

    res.json({
      success: true,
      message: 'Resolution process initiated for all expired markets',
    });
  } catch (error) {
    console.error('Error resolving markets:', error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to resolve markets',
    });
  }
});

/**
 * GET /api/nautilus/stats
 * Get Nautilus statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const isHealthy = await checkNautilusHealth();

    let totalResolutions = 0;
    let recentResolutions: Array<{ outcome: boolean; count: number }> = [];

    try {
      const [totalResult, recentResult] = await Promise.all([
        prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM nautilus_resolutions
        `,
        prisma.$queryRaw<Array<{ outcome: boolean; count: bigint }>>`
          SELECT outcome, COUNT(*) as count 
          FROM nautilus_resolutions 
          WHERE created_at > NOW() - INTERVAL '24 hours'
          GROUP BY outcome
        `,
      ]);

      totalResolutions = Number(totalResult[0]?.count || 0);
      recentResolutions = recentResult.map((r) => ({
        outcome: r.outcome,
        count: Number(r.count),
      }));
    } catch {
      // Table might not exist yet, that's okay
      console.warn('Nautilus resolutions table not found, stats will be empty');
    }

    res.json({
      success: true,
      data: {
        totalResolutions,
        recentResolutions,
        serverHealthy: isHealthy,
        serverUrl: NAUTILUS_SERVER_URL,
        enabled: process.env.NAUTILUS_ENABLED === 'true',
      },
    });
  } catch (error) {
    console.error('Error fetching Nautilus stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

export default router;
