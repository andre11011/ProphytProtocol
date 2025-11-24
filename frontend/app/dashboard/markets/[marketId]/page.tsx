"use client";

import { useParams } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Spinner,
  Progress,
  Link,
  Image,
} from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import React from "react";

import { BettingInterface } from "./_components/betting-interface";
import { MarketChart } from "./_components/market-chart";
import { MarketStats } from "./_components/market-stats";
import { RecentBets } from "./_components/recent-bets";
import { EditMarketImage } from "./_components/edit-market-image";
import { NautilusVerification } from "./_components/nautilus-verification";

import { marketUtils } from "@/lib/api/markets";
import { useMarket } from "@/hooks/queries/use-market";

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = params.marketId as string;

  const { data, isLoading: loading, error, refetch } = useMarket(marketId);

  const [market, setMarket] = React.useState(data?.data);

  React.useEffect(() => {
    if (data?.data) {
      setMarket(data.data);
    }
  }, [data]);

  const handleImageUpdated = (updatedMarket: typeof market) => {
    setMarket((prevMarket) =>
      prevMarket
        ? { ...prevMarket, imageUrl: updatedMarket?.imageUrl }
        : prevMarket,
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500">
            Error Loading Market
          </h2>
          <p className="text-gray-600 mt-2">
            {error?.message || "Market not found"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            as={Link}
            href="/dashboard"
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
            variant="flat"
          >
            Back to Markets
          </Button>
        </div>
      </div>
    );
  }

  const isActive = !market.isResolved;
  const probability = market.probability || 50;
  const timeRemaining = marketUtils.getTimeRemaining(market.endDate);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <Button
          as={Link}
          href="/dashboard"
          size="sm"
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
          variant="flat"
        >
          Back to Markets
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="shrink-0 relative">
              {market.imageUrl ? (
                <div className="relative">
                  <Image
                    alt={market.question}
                    className="rounded-lg object-cover"
                    height={150}
                    src={market.imageUrl}
                    width={200}
                  />
                  <div className="absolute top-2 right-2">
                    <EditMarketImage
                      market={market}
                      onImageUpdated={handleImageUpdated}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-[200px] h-[150px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 relative">
                  <div className="text-center">
                    <div className="text-gray-400 text-sm mb-2">No Image</div>
                    <EditMarketImage
                      market={market}
                      onImageUpdated={handleImageUpdated}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {market.question}
                </h1>
                {market.description && (
                  <p className="text-gray-600 mt-2">{market.description}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Chip
                  color={marketUtils.getStatusColor(market.status) as any}
                  variant="flat"
                >
                  {market.isResolved
                    ? "Resolved"
                    : isActive
                      ? "Active"
                      : "Ended"}
                </Chip>

                {market.protocol && (
                  <Chip color="default" variant="flat">
                    {market.protocol.displayName}
                  </Chip>
                )}

                <div className="text-sm text-gray-600">
                  Ends: {timeRemaining}
                </div>

                {market.externalLink && (
                  <Link
                    isExternal
                    showAnchorIcon
                    className="text-sm"
                    href={market.externalLink}
                  >
                    Source
                  </Link>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Current Probability
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {marketUtils.formatProbability(probability)}
                  </span>
                </div>
                <Progress
                  className="w-full"
                  color={
                    probability > 70
                      ? "success"
                      : probability < 30
                        ? "danger"
                        : "warning"
                  }
                  size="md"
                  value={probability}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>No (0%)</span>
                  <span>Yes (100%)</span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <BettingInterface market={market} onBetPlaced={refetch} />
          <MarketStats market={market} />
          <NautilusVerification market={market} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <MarketChart marketId={market.marketId} />
          <RecentBets marketId={market.marketId} />
        </div>
      </div>

      {market.rules && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Market Rules</h3>
          </CardHeader>
          <CardBody>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">
                {market.rules}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {market.isResolved && market.marketResolvedEvent && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Resolution</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Outcome:</span>
                <Chip
                  color={market.outcome ? "success" : "danger"}
                  variant="flat"
                >
                  {marketUtils.getPositionName(market.outcome!)}
                </Chip>
              </div>
              {market.resolutionDate && (
                <div className="text-sm text-gray-600">
                  Resolved on{" "}
                  {new Date(market.resolutionDate).toLocaleDateString()}
                </div>
              )}
              <div className="text-sm text-gray-600">
                Total Yield Earned:{" "}
                {marketUtils.formatVolume(
                  market.marketResolvedEvent.totalYieldEarned,
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
