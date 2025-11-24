import { Router, Request, Response } from 'express';
import {
  generateBetPortfolioImage,
  generateWinningPortfolioImage,
} from '../services/portfolio-image-generator';
import { uploadPortfolioImage } from '../services/walrus-uploader';
import { prisma } from '../db';
import { serializeBet, serializeMarket } from '../utils/serialize';

const router = Router();

/**
 * POST /api/bets/generate-bet-image
 * Generate portfolio image for placing a bet
 * Returns image URL and blob ID to be used in the contract call
 */
router.post('/generate-bet-image', async (req: Request, res: Response) => {
  try {
    const { marketId, question, position, amount } = req.body;

    if (!marketId || !question || position === undefined || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: marketId, question, position, amount',
      });
    }

    const market = await prisma.market.findUnique({
      where: { marketId },
      include: { protocol: true },
    });

    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found',
      });
    }

    console.log(`🎨 Generating bet image for market ${marketId}...`);
    const timestamp = Math.floor(Date.now() / 1000);
    const imageBuffer = await generateBetPortfolioImage({
      position: position === true || position === 'YES',
      betAmount: amount,
      marketQuestion: question,
      transactionFee: '0',
      netAmount: amount,
      timestamp,
    });

    console.log(`☁️  Uploading to Walrus...`);
    const walrusData = await uploadPortfolioImage(imageBuffer, 'bet');

    res.json({
      success: true,
      data: {
        imageUrl: walrusData.imageUrl,
        imageBlobId: walrusData.blobId,
        betProofBlobAddress: walrusData.blobId,
      },
    });
  } catch (error) {
    console.error('Error generating bet image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate bet image',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/bets/generate-winning-image
 * Generate portfolio image for claiming winnings
 * Returns image URL and blob ID to be used in the contract call
 */
router.post('/generate-winning-image', async (req: Request, res: Response) => {
  try {
    const { marketId, betId, winningAmount, betAmount } = req.body;

    if (!marketId || !betId || !winningAmount || !betAmount) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required fields: marketId, betId, winningAmount, betAmount',
      });
    }

    const bet = await prisma.bet.findUnique({
      where: { betId },
      include: {
        market: {
          include: { protocol: true },
        },
      },
    });

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: 'Bet not found',
      });
    }

    if (bet.isClaimed) {
      return res.status(400).json({
        success: false,
        error: 'Winnings already claimed',
      });
    }

    const profit = parseFloat(winningAmount) - parseFloat(betAmount);
    const profitPercentage = (profit / parseFloat(betAmount)) * 100;

    console.log(`🎨 Generating winning image for bet ${betId}...`);
    const imageBuffer = await generateWinningPortfolioImage({
      winningAmount: winningAmount.toString(),
      profitPercentage,
      marketQuestion: bet.market.question,
      position:
        bet.position === true ||
        (typeof bet.position === 'string' && bet.position === 'YES'),
      originalBetAmount: betAmount.toString(),
      yieldEarned: (
        parseFloat(winningAmount) - parseFloat(betAmount)
      ).toString(),
      resolutionTimestamp:
        'resolutionTimestamp' in bet.market && bet.market.resolutionTimestamp
          ? Math.floor(
              new Date(
                (
                  bet.market as { resolutionTimestamp?: string }
                ).resolutionTimestamp!
              ).getTime() / 1000
            )
          : Math.floor(Date.now() / 1000),
    });

    console.log(`☁️  Uploading to Walrus...`);
    const walrusData = await uploadPortfolioImage(imageBuffer, 'winning');

    res.json({
      success: true,
      data: {
        imageUrl: walrusData.imageUrl,
        imageBlobId: walrusData.blobId,
        winningProofBlobAddress: walrusData.blobId,
      },
    });
  } catch (error) {
    console.error('Error generating winning image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate winning image',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/bets/:betId
 * Get bet details by ID
 */
router.get('/:betId', async (req: Request, res: Response) => {
  try {
    const { betId } = req.params;

    const bet = await prisma.bet.findUnique({
      where: { betId },
      include: {
        market: {
          include: { protocol: true },
        },
        winningsClaimed: true,
      },
    });

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: 'Bet not found',
      });
    }

    const serializedBet = {
      ...serializeBet(bet),
      market: serializeMarket(bet.market),
      winningsClaimed: bet.winningsClaimed
        ? {
            ...bet.winningsClaimed,
            winningAmount: bet.winningsClaimed.winningAmount?.toString() || '0',
            yieldShare: bet.winningsClaimed.yieldShare?.toString() || '0',
          }
        : null,
    };

    res.json({
      success: true,
      data: serializedBet,
    });
  } catch (error) {
    console.error('Error fetching bet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bet',
    });
  }
});

/**
 * GET /api/bets/user/:address
 * Get all bets by user address
 */
router.get('/user/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const bets = await prisma.bet.findMany({
      where: { bettor: address },
      include: {
        market: {
          include: { protocol: true },
        },
        winningsClaimed: true,
      },
      orderBy: { placedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.bet.count({
      where: { bettor: address },
    });

    const serializedBets = bets.map((bet) => ({
      ...serializeBet(bet),
      market: serializeMarket(bet.market),
      winningsClaimed: bet.winningsClaimed
        ? {
            ...bet.winningsClaimed,
            winningAmount: bet.winningsClaimed.winningAmount?.toString() || '0',
            yieldShare: bet.winningsClaimed.yieldShare?.toString() || '0',
          }
        : null,
    }));

    res.json({
      success: true,
      data: serializedBets,
      meta: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error('Error fetching user bets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user bets',
    });
  }
});

/**
 * GET /api/bets/market/:marketId
 * Get all bets for a specific market
 */
router.get('/market/:marketId', async (req: Request, res: Response) => {
  try {
    const { marketId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const bets = await prisma.bet.findMany({
      where: { marketId },
      include: {
        winningsClaimed: true,
      },
      orderBy: { placedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.bet.count({
      where: { marketId },
    });

    const serializedBets = bets.map((bet) => ({
      ...serializeBet(bet),
      winningsClaimed: bet.winningsClaimed
        ? {
            ...bet.winningsClaimed,
            winningAmount: bet.winningsClaimed.winningAmount?.toString() || '0',
            yieldShare: bet.winningsClaimed.yieldShare?.toString() || '0',
          }
        : null,
    }));

    res.json({
      success: true,
      data: serializedBets,
      meta: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error('Error fetching market bets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market bets',
    });
  }
});

/**
 * GET /api/bets/recent
 * Get recent bets across all markets
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;

    const bets = await prisma.bet.findMany({
      include: {
        market: {
          include: { protocol: true },
        },
        winningsClaimed: true,
      },
      orderBy: { placedAt: 'desc' },
      take: parseInt(limit as string),
    });

    const serializedBets = bets.map((bet) => ({
      ...serializeBet(bet),
      market: serializeMarket(bet.market),
      winningsClaimed: bet.winningsClaimed
        ? {
            ...bet.winningsClaimed,
            winningAmount: bet.winningsClaimed.winningAmount?.toString() || '0',
            yieldShare: bet.winningsClaimed.yieldShare?.toString() || '0',
          }
        : null,
    }));

    res.json({
      success: true,
      data: serializedBets,
    });
  } catch (error) {
    console.error('Error fetching recent bets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent bets',
    });
  }
});

/**
 * GET /api/bets
 * Get bets with optional filters (marketId, bettor)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { marketId, bettor, limit = '50', offset = '0' } = req.query;

    const where: Record<string, string> = {};
    if (marketId) where.marketId = marketId as string;
    if (bettor) where.bettor = bettor as string;

    const bets = await prisma.bet.findMany({
      where,
      include: {
        market: {
          include: { protocol: true },
        },
        winningsClaimed: true,
      },
      orderBy: { placedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.bet.count({ where });

    const serializedBets = bets.map((bet) => ({
      ...serializeBet(bet),
      market: serializeMarket(bet.market),
      winningsClaimed: bet.winningsClaimed
        ? {
            ...bet.winningsClaimed,
            winningAmount: bet.winningsClaimed.winningAmount?.toString() || '0',
            yieldShare: bet.winningsClaimed.yieldShare?.toString() || '0',
          }
        : null,
    }));

    res.json({
      success: true,
      data: serializedBets,
      meta: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bets',
    });
  }
});

export default router;
