import { Router, Request, Response } from 'express';
import {
  getMarketChartData,
  getMarketProbability,
  getMarketVolume,
  getUserBettingHistory,
  getPlatformChartData,
} from '../services/chart-service';
import { prisma } from '../db';

const router = Router();

/**
 * GET /api/charts/market/:id
 * Get comprehensive chart data for a specific market
 * Returns data in frontend-compatible MultiLineChartData format
 */
router.get('/market/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { interval = '1h' } = req.query;

    const market = await prisma.market.findUnique({
      where: { id },
      include: {
        protocol: true,
      },
    });

    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found',
      });
    }

    const chartData = await getMarketChartData(
      market.marketId,
      interval as string
    );

    const formattedData = {
      volume: {
        yes: chartData.yesVolume.map((point) => ({
          time: point.time,
          value: point.value,
        })),
        no: chartData.noVolume.map((point) => ({
          time: point.time,
          value: point.value,
        })),
        total: chartData.totalVolume.map((point) => ({
          time: point.time,
          value: point.value,
        })),
      },
      probability: {
        yes: chartData.yesProbability.map((point) => ({
          time: point.time,
          value: point.value,
        })),
        no: chartData.noProbability.map((point) => ({
          time: point.time,
          value: point.value,
        })),
      },
      odds: {
        yes: chartData.yesOdds.map((point) => ({
          time: point.time,
          value: point.value,
        })),
        no: chartData.noOdds.map((point) => ({
          time: point.time,
          value: point.value,
        })),
      },
      bets: chartData.betCount.map((point) => ({
        time: point.time,
        value: point.value,
      })),
    };

    res.json({
      success: true,
      data: formattedData,
      meta: {
        marketId: market.marketId,
        question: market.question,
        interval,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching market chart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market chart',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/charts/market/:id/probability
 * Get simplified probability chart for a market
 */
router.get('/market/:id/probability', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { points = '50' } = req.query;

    const market = await prisma.market.findUnique({
      where: { id },
    });

    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found',
      });
    }

    const probability = await getMarketProbability(
      market.marketId,
      parseInt(points as string)
    );

    res.json({
      success: true,
      data: probability,
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching market probability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market probability',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/charts/market/:id/volume
 * Get volume chart for a market
 */
router.get('/market/:id/volume', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { interval = '1d' } = req.query;

    const market = await prisma.market.findUnique({
      where: { id },
    });

    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found',
      });
    }

    const volume = await getMarketVolume(market.marketId, interval as string);

    res.json({
      success: true,
      data: volume,
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching market volume:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market volume',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/charts/user/:address/betting-history
 * Get user betting history chart
 */
router.get(
  '/user/:address/betting-history',
  async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      const history = await getUserBettingHistory(address);

      res.json({
        success: true,
        data: history,
        meta: {
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error fetching user betting history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user betting history',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * GET /api/charts/platform
 * Get platform-wide chart data
 */
router.get('/platform', async (req: Request, res: Response) => {
  try {
    const { days = '30' } = req.query;

    const platformData = await getPlatformChartData(parseInt(days as string));

    res.json({
      success: true,
      data: platformData,
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching platform chart data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform chart data',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
