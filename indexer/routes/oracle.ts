import { Router, Request, Response } from 'express';
import { getLatestSuiPrice } from '../services/coingecko-oracle';

const router = Router();

/**
 * GET /api/oracle/price/latest
 * Get the latest SUI/USD price
 */
router.get('/price/latest', async (req: Request, res: Response) => {
  try {
    const forceRefresh = req.query.refresh === 'true';

    const priceData = await getLatestSuiPrice(forceRefresh);

    res.json({
      success: true,
      data: {
        symbol: priceData.symbol,
        currency: priceData.currency,
        price: priceData.price,
        marketCap: priceData.marketCap?.toString() || null,
        volume24h: priceData.volume24h?.toString() || null,
        change24h: priceData.change24h,
        fetchedAt: priceData.fetchedAt,
      },
      meta: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching latest price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest price',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
