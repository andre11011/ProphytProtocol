"use client";
import { useState, useMemo, useEffect } from "react";
import { Input, Spinner, Card, CardBody, Image, Divider } from "@heroui/react";
import Link from "next/link";
import { Search } from "lucide-react";

import { useMarkets } from "@/hooks/queries/use-market";
import { formatDate } from "@/lib/helper/date";
import ChartChance from "@/components/chart/chart-chance";

interface SearchPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchPopover({ isOpen, onOpenChange }: SearchPopoverProps) {
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
      .slice(0, 8)
      .map(({ market }) => market);

    return scoredMarkets;
  }, [marketsData, debouncedQuery]);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <div className="relative">
      <Input
        aria-label="Search"
        classNames={{
          inputWrapper: "bg-default-100",
          input: "text-sm",
          base: "max-w-[300px]",
        }}
        labelPlacement="outside"
        placeholder="Search markets..."
        startContent={
          <Search
            className="text-default-400 pointer-events-none shrink-0"
            size={18}
          />
        }
        type="search"
        value={searchQuery}
        onBlur={() => setTimeout(handleClose, 200)}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => onOpenChange(true)}
      />
      {isOpen && searchQuery && searchQuery.length >= 2 && (
        <div className="absolute top-full left-0 mt-2 w-[400px] max-h-[500px] overflow-y-auto bg-content1 shadow-lg rounded-lg border border-divider z-50">
          <div className="px-3 py-3 w-full">
            <p className="text-sm font-bold text-foreground mb-3">
              Results for &quot;{searchQuery}&quot;
            </p>
            {debouncedQuery !== searchQuery ? (
              <div className="flex justify-center py-8">
                <Spinner color="white" size="sm" />
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner color="white" size="sm" />
              </div>
            ) : filteredMarkets.length > 0 ? (
              <div className="flex flex-col gap-2">
                {filteredMarkets.map((market) => (
                  <Link
                    key={market.marketId}
                    className="w-full"
                    href={`/market/${market.id}`}
                    onClick={handleClose}
                  >
                    <Card
                      isPressable
                      className="w-full hover:bg-default-100 transition-colors cursor-pointer"
                    >
                      <CardBody className="p-3 w-full">
                        <div className="flex items-start gap-3 w-full">
                          <Image
                            alt="market image"
                            className="w-12 h-12 min-w-12 min-h-12 rounded-md"
                            height={48}
                            src={
                              market.imageUrl ||
                              "/images/market/default-market.png"
                            }
                            width={48}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2 mb-1">
                              {market.question}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-default-500">
                              <span>End: {formatDate(market.endDate)}</span>
                              <Divider className="h-3" orientation="vertical" />
                              <div className="flex items-center gap-1">
                                <ChartChance
                                  probabilityValue={market.probability}
                                  size={"sm"}
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
            ) : (
              <div className="text-center py-8 text-default-400">
                <p className="text-sm">No markets found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
