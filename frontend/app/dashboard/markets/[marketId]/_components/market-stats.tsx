"use client";

import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Progress,
  Divider,
} from "@heroui/react";

import { Market } from "@/types/market.types";
import { marketUtils } from "@/lib/api/markets";

interface MarketStatsProps {
  market: Market;
}

export function MarketStats({ market }: MarketStatsProps) {
  const totalYesBets = parseFloat(market.totalYesBets);
  const totalNoBets = parseFloat(market.totalNoBets);
  const totalPoolSize = parseFloat(market.totalPoolSize);
  const totalYieldEarned = parseFloat(market.totalYieldEarned);

  const yesPercentage =
    totalPoolSize > 0 ? (totalYesBets / totalPoolSize) * 100 : 50;
  const noPercentage =
    totalPoolSize > 0 ? (totalNoBets / totalPoolSize) * 100 : 50;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Market Statistics</h3>
      </CardHeader>
      <CardBody className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Trading Volume</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Volume</span>
              <span className="font-mono font-medium">
                {marketUtils.formatVolume(market.volume)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Open Interest</span>
              <span className="font-mono font-medium">
                {marketUtils.formatVolume(market.openInterest)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pool Size</span>
              <span className="font-mono font-medium">
                {marketUtils.formatVolume(market.totalPoolSize)}
              </span>
            </div>
          </div>
        </div>

        <Divider />

        <div>
          <h4 className="font-medium mb-2">Position Distribution</h4>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600 font-medium">Yes Position</span>
                <span className="font-mono">
                  {marketUtils.formatVolume(market.totalYesBets)} (
                  {Math.round(yesPercentage)}%)
                </span>
              </div>
              <Progress color="success" size="sm" value={yesPercentage} />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-red-600 font-medium">No Position</span>
                <span className="font-mono">
                  {marketUtils.formatVolume(market.totalNoBets)} (
                  {Math.round(noPercentage)}%)
                </span>
              </div>
              <Progress color="danger" size="sm" value={noPercentage} />
            </div>
          </div>
        </div>

        <Divider />

        <div>
          <h4 className="font-medium mb-2">Betting Activity</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Bets</span>
              <span className="font-medium">{market._count?.bets || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Yes Bets</span>
              <span className="font-medium text-green-600">
                {market.totalYesCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">No Bets</span>
              <span className="font-medium text-red-600">
                {market.totalNoCount}
              </span>
            </div>
          </div>
        </div>

        {totalYieldEarned > 0 && (
          <>
            <Divider />
            <div>
              <h4 className="font-medium mb-2">Yield Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Total Yield Earned
                  </span>
                  <span className="font-mono font-medium text-green-600">
                    {marketUtils.formatVolume(market.totalYieldEarned)}
                  </span>
                </div>
                {market.protocol && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Protocol APY</span>
                    <Chip color="success" size="sm" variant="flat">
                      {market.protocol.apy || "N/A"}
                    </Chip>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <Divider />

        <div>
          <h4 className="font-medium mb-2">Market Information</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Created</span>
              <span className="text-sm">
                {new Date(market.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ends</span>
              <span className="text-sm">
                {new Date(market.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Creator</span>
              <span
                className="text-xs font-mono truncate max-w-[120px]"
                title={market.creator}
              >
                {market.creator}
              </span>
            </div>
            {market.platform && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Platform</span>
                <Chip size="sm" variant="flat">
                  {market.platform}
                </Chip>
              </div>
            )}
          </div>
        </div>

        {market.protocol && (
          <>
            <Divider />
            <div>
              <h4 className="font-medium mb-2">Protocol</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {market.protocol.iconUrl && (
                    <img
                      alt={market.protocol.name}
                      className="w-6 h-6 rounded-full"
                      src={market.protocol.iconUrl}
                    />
                  )}
                  <span className="font-medium">
                    {market.protocol.displayName}
                  </span>
                </div>
                {market.protocol.description && (
                  <p className="text-sm text-gray-600">
                    {market.protocol.description}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <Divider />
        <div>
          <h4 className="font-medium mb-2">Timing</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Time Remaining</span>
              <Chip
                color={!market.isResolved ? "success" : "warning"}
                size="sm"
                variant="flat"
              >
                {marketUtils.getTimeRemaining(market.endDate)}
              </Chip>
            </div>
            {market.isResolved && market.resolutionDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resolved</span>
                <span className="text-sm">
                  {new Date(market.resolutionDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
