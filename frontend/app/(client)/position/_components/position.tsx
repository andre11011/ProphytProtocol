"use client";
import { useState, useMemo } from "react";
import {
  Card,
  CardFooter,
  CardHeader,
  Image,
  Divider,
  CardBody,
  Button,
  Chip,
  Pagination,
  Skeleton,
} from "@heroui/react";
import { Award } from "lucide-react";
import Link from "next/link";
import { useCurrentAccount } from "@mysten/dapp-kit";

import ChartChance from "@/components/chart/chart-chance";
import { formatNumber } from "@/lib/helper/number";
import { useMarkets } from "@/hooks/queries/use-market";
import { formatDate } from "@/lib/helper/date";
import { Market } from "@/types/market.types";
import { useUserBets } from "@/hooks/queries/use-bet";
import { useClaimWinnings } from "@/hooks/mutations/use-claim-winnings";
import { Bet } from "@/types";

export default function Position() {
  const currnetAccount = useCurrentAccount();
  const [positionsPage, setPositionsPage] = useState(1);
  const { claimWinnings, isPending: isClaimPending } = useClaimWinnings();

  const ITEMS_PER_PAGE = 12;

  const shouldFetchBets = !!currnetAccount?.address;
  const { data: userBetsData, isLoading: betsLoading } = useUserBets(
    currnetAccount?.address || "",
    {
      limit: ITEMS_PER_PAGE,
      offset: (positionsPage - 1) * ITEMS_PER_PAGE,
    },
    shouldFetchBets,
  );

  const userBets = useMemo(() => {
    return userBetsData?.data || [];
  }, [userBetsData]);

  const { data: allMarketsData } = useMarkets({ limit: 1000 });

  const userPositions = useMemo(() => {
    if (!allMarketsData?.data || !userBets.length) return [];

    return userBets
      .map((bet) => {
        const market = allMarketsData.data.find(
          (m) => m.marketId?.toString() === bet.marketId?.toString(),
        );

        if (market) {
          return {
            bet,
            market,
            position: bet.position ? "YES" : "NO",
          };
        }

        return null;
      })
      .filter(
        (item): item is { bet: Bet; market: Market; position: string } =>
          item !== null,
      );
  }, [allMarketsData, userBets]);

  const positionsTotalPages = userPositions.length
    ? Math.ceil(userPositions.length / ITEMS_PER_PAGE)
    : 1;

  const handleClaimWinnings = (market: Market) => {
    if (!market.marketId) return;
    const userPosition = userPositions.find(
      ({ market: m }) => m.marketId === market.marketId,
    );

    if (!userPosition) return;
    claimWinnings({
      marketId: market.marketId,
      blockchainMarketId: Number(market.blockchainMarketId),
      betAmount: userPosition?.bet.amount as string,
      betId: userPosition?.bet.betId as string,
      betIndex: userPosition?.bet.betId as string,
      winningAmount: userPosition?.bet.winningAmount as string,
    });
  };

  return (
    <section className="flex flex-col gap-5 pb-10">
      <div>
        <h1 className="text-4xl">YOUR POSITION</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {!currnetAccount?.address ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-10">
            <p className="text-neutral-400">
              Connect your wallet to view your positions
            </p>
          </div>
        ) : betsLoading ? (
          Array.from({ length: 9 }).map((_, index) => (
            <Card key={index} className="w-full p-3">
              <CardHeader className="grid grid-cols-[80%_auto] items-center gap-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full rounded-lg" />
                    <Skeleton className="h-3 w-4/5 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="w-16 h-6 rounded-lg" />
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20 rounded-lg" />
                    <Skeleton className="h-4 w-24 rounded-lg" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20 rounded-lg" />
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20 rounded-lg" />
                    <Skeleton className="h-5 w-8 rounded-lg" />
                  </div>
                </div>
              </CardBody>
              <CardFooter>
                <div className="flex gap-2 items-center w-full justify-between">
                  <Skeleton className="h-4 w-32 rounded-lg" />
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </div>
              </CardFooter>
            </Card>
          ))
        ) : userPositions.length > 0 ? (
          userPositions
            .slice(
              (positionsPage - 1) * ITEMS_PER_PAGE,
              positionsPage * ITEMS_PER_PAGE,
            )
            .map(({ bet, market, position }) => {
              const betAmount = parseFloat(bet.amount || "0");
              const isResolved = market.status === "resolved";
              const result =
                position === "YES"
                  ? bet.position === true
                  : position === "NO"
                    ? bet.position === false
                    : false;
              const userWon = isResolved && result;

              return (
                <Link key={bet.id} href={`/market/${market.id}`}>
                  <Card className="w-full p-3 transition-transform duration-200 hover:-translate-y-0.5">
                    <CardHeader className="grid grid-cols-[80%_auto] items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Image
                          alt="market image"
                          className="w-10 h-10 min-w-10 min-h-10"
                          height={40}
                          radius="sm"
                          src={
                            market.imageUrl ||
                            "/images/market/default-market.png"
                          }
                          width={40}
                        />
                        <span className="text-sm line-clamp-2">
                          {market.question}
                        </span>
                      </div>
                      <div className="min-w-15">
                        {isResolved ? (
                          <Chip
                            color={userWon ? "success" : "danger"}
                            size="sm"
                            variant="flat"
                          >
                            {userWon ? "Won" : "Lost"}
                          </Chip>
                        ) : (
                          <ChartChance probabilityValue={market.probability} />
                        )}
                      </div>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-400">Your Bet:</span>
                          <span className="font-semibold">
                            {formatNumber(betAmount / 1e9, {
                              decimals: 2,
                              suffix: " SUI",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-400">Position:</span>
                          <Chip
                            color={position === "YES" ? "success" : "danger"}
                            size="sm"
                            variant="flat"
                          >
                            {position}
                          </Chip>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-neutral-400">Staked In:</span>
                          <div className="relative w-6 h-4 md:w-8 md:h-5 shrink-0">
                            <Image
                              alt="avatar-1"
                              className="rounded-full absolute top-0 left-0 z-0"
                              height={16}
                              src={
                                market.protocol?.iconUrl ||
                                "/images/token/sui.png"
                              }
                              width={16}
                            />
                            <Image
                              alt="avatar-2"
                              className="rounded-full absolute top-0 left-2 md:left-3 z-10"
                              height={16}
                              src="/images/token/sui.png"
                              width={16}
                            />
                          </div>
                        </div>
                      </div>
                    </CardBody>
                    <CardFooter>
                      {isResolved && userWon ? (
                        <Button
                          className="w-full"
                          color="success"
                          isLoading={isClaimPending}
                          startContent={<Award size={18} />}
                          variant="flat"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleClaimWinnings(market);
                          }}
                        >
                          Claim Winnings
                        </Button>
                      ) : (
                        <div className="flex gap-2 items-center w-full justify-between text-sm">
                          <span className="text-neutral-400">
                            End: {formatDate(market.endDate)}
                          </span>
                          <Chip size="sm" variant="flat">
                            {isResolved ? "Resolved" : "Active"}
                          </Chip>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                </Link>
              );
            })
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-10">
            <p className="text-neutral-400">
              You haven&apos;t placed any bets yet
            </p>
          </div>
        )}
      </div>
      {positionsTotalPages > 1 && currnetAccount?.address && !betsLoading && (
        <div className="flex justify-center mt-4">
          <Pagination
            showControls
            color="primary"
            page={positionsPage}
            total={positionsTotalPages}
            onChange={setPositionsPage}
          />
        </div>
      )}
    </section>
  );
}
