"use client";
import { useState, useEffect } from "react";
import {
  Tab,
  Tabs,
  Card,
  CardFooter,
  CardHeader,
  Divider,
  CardBody,
  Button,
  Pagination,
  Skeleton,
} from "@heroui/react";
import Image from "next/image";
import { AlignEndHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

import { DialogPlaceBet } from "./dialog-place-bet";

import CarouselBanner from "@/components/carousel/carousel-banner";
import ChartChance from "@/components/chart/chart-chance";
import { formatNumber } from "@/lib/helper/number";
import { useMarkets } from "@/hooks/queries/use-market";
import { formatDate } from "@/lib/helper/date";
import { Market } from "@/types/market.types";
import { useLatestPrice } from "@/hooks/queries/use-price";
import { siteConfig } from "@/config/site";

export default function Dashboard() {
  const { data: priceData } = useLatestPrice({ symbol: "SUI" });
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<boolean | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [trendingPage, setTrendingPage] = useState(1);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");

      if (tab) {
        queueMicrotask(() => setSelectedTab(tab));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);

      if (selectedTab === "trending") {
        params.delete("tab");
      } else {
        params.set("tab", selectedTab);
      }
      const newUrl = params.toString()
        ? `?${params.toString()}`
        : window.location.pathname;

      window.history.replaceState({}, "", newUrl);
    }
  }, [selectedTab]);

  const ITEMS_PER_PAGE = 12;

  const { data: trendingMarketsData, isLoading: marketsLoading } = useMarkets({
    limit: ITEMS_PER_PAGE,
    offset: (trendingPage - 1) * ITEMS_PER_PAGE,
    status: "active",
    sort_by: "tvl",
    order: "desc",
  });

  const handleOpenDialog = (market: Market, position: boolean) => {
    setSelectedMarket(market);
    setSelectedPosition(position);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedMarket(null);
    setSelectedPosition(null);
  };

  const bannerCards = [
    {
      tag: "community",
      title: "Join our Community",
      bgImage: "/images/walrus/2.png",
      footerTitle: "Follow X",
      buttonText: "Follow",
      link: siteConfig.links.x,
      linkTarget: "_blank",
    },
    {
      tag: "feedback",
      title: "Give us your Feedback",
      bgImage: "/images/walrus/3.png",
      footerTitle: "Any Suggestions?",
      buttonText: "Submit",
      link: siteConfig.links.mail,
      linkTarget: "_blank",
    },
    {
      tag: "bug",
      title: "Any Bugs?",
      bgImage: "/images/walrus/4.png",
      footerTitle: "Report",
      buttonText: "Report",
      link: siteConfig.links.mail,
      linkTarget: "_blank",
    },
    {
      tag: "github",
      title: "Github",
      bgImage: "/images/walrus/5.png",
      footerTitle: "Github",
      buttonText: "Open",
      link: siteConfig.links.github,
      linkTarget: "_blank",
    },
    {
      tag: "soon",
      title: "Testnet",
      bgImage: "/images/walrus/1.png",
      footerTitle: "Join Waitlist",
      buttonText: "Soon",
    },
  ];

  const trendingTotalPages = trendingMarketsData?.meta?.total
    ? Math.ceil(trendingMarketsData.meta.total / ITEMS_PER_PAGE)
    : 1;

  return (
    <section className="flex flex-col gap-5 pb-10">
      <CarouselBanner options={{ loop: true }} slides={bannerCards} />

      <Tabs
        aria-label="Options"
        color="primary"
        selectedKey={selectedTab}
        variant="solid"
        onSelectionChange={(key) => setSelectedTab(key as string)}
      >
        <Tab
          key="all"
          className="h-10"
          title={
            <div className="flex items-center space-x-2">
              <AlignEndHorizontal size={20} />
              <span>All Market</span>
            </div>
          }
        />
      </Tabs>

      {selectedTab === "all" && (
        <>
          {marketsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <Card key={index} className="w-full h-full p-3">
                  <CardHeader className="grid grid-cols-[80%_auto] items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-full rounded-lg" />
                        <Skeleton className="h-3 w-4/5 rounded-lg" />
                      </div>
                    </div>
                    <Skeleton className="w-12 h-12 rounded-full" />
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <div className="flex gap-2 items-center w-full">
                      <Skeleton className="h-10 flex-1 rounded-lg" />
                      <Skeleton className="h-10 flex-1 rounded-lg" />
                    </div>
                  </CardBody>
                  <CardFooter>
                    <div className="flex gap-2 items-center w-full justify-between">
                      <Skeleton className="h-4 w-24 rounded-lg" />
                      <Skeleton className="h-4 w-32 rounded-lg" />
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
              {trendingMarketsData?.data &&
              trendingMarketsData.data.length > 0 ? (
                trendingMarketsData.data.map((market) => {
                  return (
                    <Link key={market.marketId} href={`/market/${market.id}`}>
                      <Card className="w-full h-full flex flex-col p-0 overflow-hidden border border-neutral-200 transition-all duration-300 hover:border-primary shadow-none hover:shadow-sm">
                        <div className="relative aspect-video bg-default-100 overflow-hidden">
                          <Image
                            alt="market background"
                            className="w-full h-full object-cover max-w-full"
                            height={225}
                            src={
                              market.imageUrl ||
                              "/images/market/default-market.png"
                            }
                            width={400}
                          />
                          <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-md rounded-2xl p-2">
                            <ChartChance
                              probabilityValue={market.probability}
                            />
                          </div>
                          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md z-10 whitespace-nowrap">
                            <Image
                              alt="protocol"
                              className="rounded-full"
                              height={20}
                              src={
                                market.protocol?.iconUrl ||
                                "/images/market/default-protocol.png"
                              }
                              width={20}
                            />
                            <span className="text-xs font-medium">
                              {market.protocol?.name}
                            </span>
                          </div>
                        </div>

                        <CardHeader className="flex-col items-start gap-3 p-4 pb-3">
                          <div className="flex items-start justify-between w-full gap-2">
                            <span className="text-sm font-semibold line-clamp-2 leading-tight">
                              {market.question}
                            </span>
                          </div>

                          <div className="flex flex-row items-center justify-between w-full text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-default-500 uppercase tracking-wide">
                                TVL
                              </span>
                              <span className="font-semibold text-foreground">
                                {priceData?.data.price
                                  ? formatNumber(
                                      (Number(market.totalPoolSize) / 1e9) *
                                        priceData.data.price,
                                      {
                                        compact: true,
                                        thousandSeparator: ",",
                                        decimals: 2,
                                        prefix: "$",
                                      },
                                    )
                                  : formatNumber(
                                      Number(market.totalPoolSize) / 1e9,
                                      {
                                        compact: true,
                                        thousandSeparator: ",",
                                        decimals: 2,
                                        suffix: " SUI",
                                      },
                                    )}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-default-500 uppercase tracking-wide">
                                end
                              </span>
                              <span className="font-semibold text-foreground">
                                {formatDate(market.endDate)}
                              </span>
                            </div>
                          </div>
                        </CardHeader>

                        <Divider />

                        <div className="p-3">
                          <div className="flex gap-2 items-center w-full">
                            <Button
                              className="text-sm flex-1 font-semibold"
                              color="primary"
                              size="lg"
                              startContent={<ChevronUp size={18} />}
                              variant="flat"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenDialog(market, true);
                              }}
                            >
                              Yes
                            </Button>

                            <Button
                              className="text-sm flex-1 font-semibold"
                              color="danger"
                              size="lg"
                              startContent={<ChevronDown size={18} />}
                              variant="flat"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenDialog(market, false);
                              }}
                            >
                              No
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })
              ) : (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-10">
                  <p className="text-neutral-400">No markets available</p>
                </div>
              )}
            </div>
          )}

          {trendingTotalPages > 1 && !marketsLoading && (
            <div className="flex justify-center mt-6 pb-4">
              <Pagination
                showControls
                color="primary"
                page={trendingPage}
                total={trendingTotalPages}
                onChange={setTrendingPage}
              />
            </div>
          )}
        </>
      )}

      <DialogPlaceBet
        defaultPosition={selectedPosition}
        isOpen={isDialogOpen}
        market={selectedMarket || undefined}
        onOpenChange={handleCloseDialog}
      />
    </section>
  );
}
