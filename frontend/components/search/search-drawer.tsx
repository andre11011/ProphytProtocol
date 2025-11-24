/* eslint-disable jsx-a11y/no-autofocus */
"use client";
import { useState, useMemo, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Input,
  Spinner,
  Card,
  CardBody,
  Image,
  Divider,
} from "@heroui/react";
import Link from "next/link";
import { Search } from "lucide-react";

import { useMarkets } from "@/hooks/queries/use-market";
import { formatDate } from "@/lib/helper/date";
import ChartChance from "@/components/chart/chart-chance";

interface SearchDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDrawer({ isOpen, onOpenChange }: SearchDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { data: marketsData, isLoading } = useMarkets({ limit: 50 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredMarkets = useMemo(() => {
    if (!marketsData?.data || !debouncedQuery || debouncedQuery.length < 2)
      return [];

    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    };

    const queryNormalized = normalizeText(debouncedQuery);
    const queryWords = queryNormalized.split(" ").filter((w) => w.length > 0);

    const scoredMarkets = marketsData.data
      .map((market) => {
        const questionNormalized = normalizeText(market.question || "");
        const descriptionNormalized = normalizeText(market.description || "");

        let score = 0;

        if (questionNormalized.includes(queryNormalized)) {
          score += 100;
        }
        if (descriptionNormalized.includes(queryNormalized)) {
          score += 50;
        }

        queryWords.forEach((word) => {
          if (questionNormalized.includes(word)) {
            score += 10;
          }
          if (descriptionNormalized.includes(word)) {
            score += 5;
          }

          if (questionNormalized.startsWith(word)) {
            score += 20;
          }
        });

        return { market, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ market }) => market);

    return scoredMarkets;
  }, [marketsData, debouncedQuery]);

  return (
    <Drawer isOpen={isOpen} placement="bottom" onOpenChange={onOpenChange}>
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">
              Search Markets
            </DrawerHeader>
            <DrawerBody className="pb-6">
              <div className="mb-4">
                <Input
                  autoFocus
                  aria-label="Search"
                  classNames={{
                    inputWrapper: "bg-default-100",
                    input: "text-sm",
                  }}
                  placeholder="Search markets..."
                  startContent={
                    <Search
                      className="text-default-400 pointer-events-none shrink-0"
                      size={18}
                    />
                  }
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchQuery.length > 0 && searchQuery.length < 2 ? (
                <div className="text-center py-12 text-default-400">
                  <Search className="mx-auto mb-2" size={32} />
                  <p className="text-sm">Type at least 2 characters</p>
                </div>
              ) : debouncedQuery !== searchQuery ? (
                <div className="flex justify-center py-8">
                  <Spinner color="white" />
                </div>
              ) : isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner color="white" />
                </div>
              ) : filteredMarkets.length > 0 ? (
                <div className="flex flex-col gap-3 w-full">
                  {filteredMarkets.map((market) => (
                    <Link
                      key={market.marketId}
                      className="w-full"
                      href={`/market/${market.id}`}
                      onClick={() => onClose()}
                    >
                      <Card
                        isPressable
                        className="w-full hover:bg-default-100 transition-colors cursor-pointer"
                      >
                        <CardBody className="p-4 w-full">
                          <div className="flex items-start gap-3 w-full">
                            <Image
                              alt="market image"
                              className="w-16 h-16 min-w-16 min-h-16 rounded-md"
                              height={64}
                              src={
                                market.imageUrl ||
                                "/images/market/default-market.png"
                              }
                              width={64}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-2 mb-2">
                                {market.question}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-default-500">
                                <span>End: {formatDate(market.endDate)}</span>
                                <Divider
                                  className="h-3"
                                  orientation="vertical"
                                />
                                <div className="flex items-center gap-1">
                                  <ChartChance
                                    probabilityValue={market.probability}
                                    size="sm"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-12 text-default-400">
                  <Search className="mx-auto mb-2" size={32} />
                  <p className="text-sm">No markets found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="text-center py-12 text-default-400">
                  <Search className="mx-auto mb-2" size={32} />
                  <p className="text-sm">Start typing to search markets</p>
                </div>
              )}
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
