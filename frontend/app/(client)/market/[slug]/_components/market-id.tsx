"use client";
import Image from "next/image";
import { ChevronLeft, TimerIcon } from "lucide-react";
import { Card, CardBody, Tooltip, Button, Skeleton } from "@heroui/react";
import { useEffect, useState, useMemo } from "react";
import { marked } from "marked";
import { useRouter } from "next/navigation";

import MarketChart from "./market-chart";
import { PlaceBet } from "./place-bet";
import MarketActivity from "./market-activity";
import { DialogPlaceBet } from "./dialog-place-bet";

import { useMarket } from "@/hooks/queries/use-market";
import { formatNumber } from "@/lib/helper/number";
import { formatDate } from "@/lib/helper/date";
import { useLatestPrice } from "@/hooks/queries/use-price";

export default function MarketId({ id }: { id: string }) {
  const router = useRouter();

  const { data, isLoading } = useMarket(id);
  const market = data?.data;
  const { data: priceData } = useLatestPrice({ symbol: "SUI" });

  const [expanded, setExpanded] = useState(false);
  const [html, setHtml] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const tvlDisplay = useMemo(() => {
    const totalPool = parseFloat(market?.totalPoolSize || "0");
    const normalizedTotalPool = totalPool / 1e9;

    if (priceData?.data.price) {
      return formatNumber(normalizedTotalPool * priceData.data.price, {
        decimals: 2,
        thousandSeparator: ",",
        compact: true,
        prefix: "$",
      });
    }

    return formatNumber(normalizedTotalPool, {
      decimals: 2,
      thousandSeparator: ",",
      compact: true,
      suffix: " SUI",
    });
  }, [market?.totalPoolSize, priceData && priceData.data.price]);

  const yieldDisplay = useMemo(() => {
    const totalYield = parseFloat(market?.totalYieldEarned || "0");

    if (priceData?.data.price) {
      return formatNumber(totalYield * priceData.data.price, {
        decimals: 0,
        thousandSeparator: ",",
        compact: true,
        prefix: "$",
      });
    }

    return formatNumber(totalYield, {
      decimals: 0,
      thousandSeparator: ",",
      compact: true,
      suffix: " SUI",
    });
  }, [market?.totalYieldEarned, priceData && priceData.data.price]);

  useEffect(() => {
    const processMarkdown = async () => {
      if (market?.description) {
        const renderer = new marked.Renderer();

        renderer.link = ({ href, title, tokens }) => {
          const text = tokens
            ? tokens.map((token: any) => token.raw || "").join("")
            : "";
          const titleAttr = title ? ` title="${title}"` : "";

          return `<a class="marked-links" href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
        };

        const processedHtml = await marked(market.description || "", {
          renderer,
        });

        setHtml(processedHtml);
      }
    };

    processMarkdown();
  }, [market?.description]);

  if (isLoading) {
    return (
      <section className="pb-24 xl:pb-10">
        <Skeleton className="w-20 h-6 rounded-lg mb-5" />

        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3 md:gap-5">
              <Skeleton className="w-[60px] h-[60px] rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-3/4 rounded-lg" />
                <Skeleton className="h-8 w-1/2 rounded-lg" />
              </div>
            </div>

            <div className="flex flex-col xl:grid xl:grid-cols-[1fr_384px] xl:space-x-10 gap-6 xl:gap-0">
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6">
                  <Skeleton className="w-32 h-10 rounded-lg" />
                  <Skeleton className="w-48 h-10 rounded-lg" />
                  <Skeleton className="w-40 h-10 rounded-lg" />
                </div>

                <Card className="mb-6">
                  <CardBody className="p-6">
                    <Skeleton className="h-64 w-full rounded-lg" />
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="p-6">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full rounded-lg" />
                      <Skeleton className="h-4 w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4 rounded-lg" />
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div className="hidden xl:block xl:w-96">
                <Card className="border border-neutral-400 shadow-none">
                  <CardBody className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-32 rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 flex-1 rounded-lg" />
                        <Skeleton className="h-8 flex-1 rounded-lg" />
                        <Skeleton className="h-8 w-16 rounded-lg" />
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <Card className="border border-neutral-400 shadow-none mt-4">
                  <CardBody className="p-6">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full rounded-lg" />
                      <Skeleton className="h-4 w-full rounded-lg" />
                      <Skeleton className="h-4 w-full rounded-lg" />
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!market) {
    return (
      <section className="pb-10">
        <div className="flex items-center justify-center h-96">
          <div className="text-neutral-400">Market not found</div>
        </div>
      </section>
    );
  }

  return (
    <section className="pb-24 xl:pb-10">
      <button
        className="px-0 w-fit mb-5 text-default-500 text-sm flex items-center gap-1 hover:text-default-600 transition-colors cursor-pointer"
        onClick={() => router.back()}
      >
        <ChevronLeft /> Back
      </button>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card className="overflow-hidden border-2 border-primary/20">
            <div className="relative h-40 bg-default-100 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0)]" />
              <Image
                fill
                alt="Market Background"
                className="w-full h-full object-cover opacity-30"
                src={market.imageUrl || "/placeholder-market.png"}
              />

              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
                <Image
                  alt="protocol"
                  className="rounded-full"
                  height={24}
                  src={market.protocol?.iconUrl || "/images/token/sui.png"}
                  width={24}
                />
                <span className="text-sm font-medium">
                  {market.protocol?.name || "Protocol"}
                </span>
              </div>
            </div>

            <CardBody className="p-6">
              <div className="flex items-start gap-4">
                <Image
                  alt="Market Image"
                  className="rounded-xl shrink-0"
                  height={80}
                  src={market.imageUrl || "/placeholder-market.png"}
                  width={80}
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 leading-tight">
                    {market.question}
                  </span>

                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-5">
                    <Card className="w-fit border border-neutral-400 shadow-none h-10">
                      <CardBody className="flex flex-row items-center gap-2 text-xs md:text-sm px-3 overflow-hidden">
                        <span className="text-neutral-400">TVL</span>
                        <span className="font-medium">{tvlDisplay}</span>
                      </CardBody>
                    </Card>
                    <Card className="w-fit border border-neutral-400 shadow-none h-10">
                      <CardBody className="flex flex-row items-center gap-2 px-3 overflow-hidden">
                        <TimerIcon className="w-4 h-4 md:w-[18px] md:h-[18px] shrink-0" />
                        <span className="text-xs md:text-sm whitespace-nowrap">
                          {formatDate(market.createdAt)} -{" "}
                          {formatDate(market.endDate)}
                        </span>
                      </CardBody>
                    </Card>
                    <Tooltip
                      content={
                        <div className="px-1 py-2">
                          <span className="text-small font-bold">
                            Total Yield
                          </span>
                          <p className="text-tiny">
                            This is the total yield generated until the end of
                            the market.
                          </p>
                        </div>
                      }
                    >
                      <Card className="w-fit border border-green-400/30 h-10">
                        <CardBody className="flex flex-row items-center gap-2 text-green-500 text-xs md:text-sm px-3 overflow-hidden">
                          <div className="relative w-6 h-4 md:w-8 md:h-5 shrink-0">
                            <Image
                              alt="avatar-1"
                              className="rounded-full absolute top-0 left-0 z-0"
                              height={20}
                              src={
                                market.protocol?.iconUrl ||
                                "/images/token/sui.png"
                              }
                              width={20}
                            />
                            <Image
                              alt="avatar-2"
                              className="rounded-full absolute top-0 left-2 md:left-3 z-10"
                              height={20}
                              src="/images/token/sui.png"
                              width={20}
                            />
                          </div>
                          <span className="font-medium">{yieldDisplay}</span>
                        </CardBody>
                      </Card>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex flex-col xl:grid xl:grid-cols-[1fr_384px] xl:space-x-10 gap-6 xl:gap-0">
            <div className="flex flex-col space-y-6">
              <MarketChart marketId={id} />

              {html && (
                <Card className="border-2 border-default-200">
                  <CardBody className="p-6">
                    <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
                      Market Details
                    </h2>
                    <div
                      dangerouslySetInnerHTML={{ __html: html }}
                      className={`prose prose-blue max-w-none text-sm transition-all ${
                        expanded ? "" : "line-clamp-3"
                      }`}
                      style={{
                        // @ts-ignore
                        "--tw-prose-links": "#3b82f6",
                      }}
                    />
                    <button
                      className="text-primary font-semibold text-sm mt-3 hover:underline cursor-pointer transition-all"
                      onClick={() => setExpanded(!expanded)}
                    >
                      {expanded ? "Show less ↑" : "Show more ↓"}
                    </button>
                  </CardBody>
                </Card>
              )}

              {market.marketId && <MarketActivity marketId={market.marketId} />}
            </div>

            <div className="hidden xl:block xl:w-96 xl:sticky xl:top-20 xl:self-start place-items-end">
              <PlaceBet isLoading={isLoading} market={market} />
            </div>
          </div>
        </div>
      </div>

      <div className="xl:hidden fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black via-black/95 to-transparent z-50">
        <Button
          className="w-full h-14 text-lg font-semibold cursor-pointer shadow-xl"
          color="primary"
          size="lg"
          onPress={() => setIsDialogOpen(true)}
        >
          Place Bet
        </Button>
      </div>

      <DialogPlaceBet
        isOpen={isDialogOpen}
        market={market}
        onOpenChange={setIsDialogOpen}
      />
    </section>
  );
}
