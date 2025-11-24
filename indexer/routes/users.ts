import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { serializeBet, serializeMarket } from '../utils/serialize';

const router = Router();

/**
 * GET /api/users/:address/bets
 * Get all bets by user address
 */
router.get('/:address/bets', async (req: Request, res: Response) => {
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
 * GET /api/users/:address/stats
 * Get betting statistics for a user
 */
router.get('/:address/stats', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const bets = await prisma.bet.findMany({
      where: { bettor: address },
      include: {
        market: true,
        winningsClaimed: true,
      },
    });

    const totalBets = bets.length;
    const totalAmount = bets.reduce((sum, b) => sum + Number(b.amount), 0);

    const yesBets = bets.filter((b) => b.position === true).length;
    const noBets = bets.filter((b) => b.position === false).length;

    const resolvedBets = bets.filter((b) => b.market.isResolved);
    const wonBets = resolvedBets.filter(
      (b) => b.position === b.market.outcome
    ).length;
    const lostBets = resolvedBets.filter(
      (b) => b.position !== b.market.outcome
    ).length;

    const totalWinnings = bets.reduce(
      (sum, b) => sum + Number(b.winningAmount || 0),
      0
    );
    const totalYieldEarned = bets.reduce(
      (sum, b) => sum + Number(b.yieldShare || 0),
      0
    );

    const claimedBets = bets.filter((b) => b.isClaimed).length;
    const unclaimedWinnings = wonBets - claimedBets;

    const winRate =
      resolvedBets.length > 0 ? (wonBets / resolvedBets.length) * 100 : 0;

    const stats = {
      bettor: address,
      totalBets,
      totalAmount,
      yesBets,
      noBets,
      resolvedBets: resolvedBets.length,
      wonBets,
      lostBets,
      winRate,
      totalWinnings,
      totalYieldEarned,
      claimedBets,
      unclaimedWinnings,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stats',
    });
  }
});

export default router;
