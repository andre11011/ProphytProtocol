"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@heroui/react";
import { SwatchIcon } from "@heroicons/react/24/outline";

import { getMarketBets, marketUtils } from "@/lib/api/markets";
import { Bet } from "@/types/market";

interface RecentBetsProps {
  marketId: string;
  limit?: number;
}

export function RecentBets({ marketId, limit = 10 }: RecentBetsProps) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBets = async () => {
    setLoading(true);
    setError(null);

    try {
      const betsData = await getMarketBets(marketId);

      const sortedBets = betsData
        .sort(
          (a, b) =>
            new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
        )
        .slice(0, limit);

      setBets(sortedBets);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load bets";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (marketId) {
      loadBets();
    }
  }, [marketId, limit]);

  const handleRefresh = () => {
    loadBets();
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimeAgo = (date: string): string => {
    const now = new Date();
    const betTime = new Date(date);
    const diff = now.getTime() - betTime.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;

    return "Just now";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center w-full">
          <h3 className="text-lg font-semibold">Recent Bets</h3>
          <Button
            isLoading={loading}
            size="sm"
            startContent={<SwatchIcon className="w-4 h-4" />}
            variant="flat"
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner size="md" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">Error loading bets</p>
            <p className="text-sm text-gray-600">{error}</p>
            <Button
              className="mt-2"
              size="sm"
              variant="flat"
              onClick={handleRefresh}
            >
              Try Again
            </Button>
          </div>
        ) : bets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No bets placed yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Be the first to place a bet on this market!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="hidden md:block">
              <Table removeWrapper aria-label="Recent bets table">
                <TableHeader>
                  <TableColumn>Bettor</TableColumn>
                  <TableColumn>Position</TableColumn>
                  <TableColumn>Amount</TableColumn>
                  <TableColumn>Time</TableColumn>
                  <TableColumn>Status</TableColumn>
                </TableHeader>
                <TableBody>
                  {bets.map((bet, index) => (
                    <TableRow key={bet.id || index}>
                      <TableCell>
                        <span className="font-mono text-sm" title={bet.bettor}>
                          {formatAddress(bet.bettor)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={bet.position ? "success" : "danger"}
                          size="sm"
                          variant="flat"
                        >
                          {marketUtils.getPositionName(bet.position)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium">
                          {marketUtils.formatVolume(bet.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {formatTimeAgo(bet.placedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {bet.isClaimed ? (
                            <Chip color="success" size="sm" variant="flat">
                              Claimed
                            </Chip>
                          ) : bet.winningAmount ? (
                            <Chip color="primary" size="sm" variant="flat">
                              Won
                            </Chip>
                          ) : (
                            <Chip color="default" size="sm" variant="flat">
                              Active
                            </Chip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden space-y-3">
              {bets.map((bet, index) => (
                <div
                  key={bet.id || index}
                  className="bg-gray-50 rounded-lg p-3 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-sm" title={bet.bettor}>
                        {formatAddress(bet.bettor)}
                      </span>
                      <div className="text-xs text-gray-500">
                        {formatTimeAgo(bet.placedAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {bet.isClaimed ? (
                        <Chip color="success" size="sm" variant="flat">
                          Claimed
                        </Chip>
                      ) : bet.winningAmount ? (
                        <Chip color="primary" size="sm" variant="flat">
                          Won
                        </Chip>
                      ) : (
                        <Chip color="default" size="sm" variant="flat">
                          Active
                        </Chip>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Chip
                      color={bet.position ? "success" : "danger"}
                      size="sm"
                      variant="flat"
                    >
                      {marketUtils.getPositionName(bet.position)}
                    </Chip>
                    <span className="font-mono font-medium">
                      {marketUtils.formatVolume(bet.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {bets.length >= limit && (
              <div className="text-center pt-4">
                <Button size="sm" variant="flat" onClick={() => {}}>
                  Show More Bets
                </Button>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
