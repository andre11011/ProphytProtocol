"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Button,
  Chip,
  Pagination,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Link,
  Progress,
} from "@heroui/react";
import { SwatchIcon } from "@heroicons/react/24/outline";
import { SearchIcon } from "lucide-react";

import { getMarkets, marketUtils } from "@/lib/api/markets";
import { Market, MarketFilters } from "@/types/market";

const ITEMS_PER_PAGE = 10;

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");

  const loadMarkets = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      setError(null);

      try {
        const filters: MarketFilters = {
          limit: ITEMS_PER_PAGE,
          offset: (page - 1) * ITEMS_PER_PAGE,
        };

        if (statusFilter !== "all") {
          filters.status = statusFilter;
        }

        const response = await getMarkets(filters);

        if (response.success) {
          let filteredMarkets = response.data;

          if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();

            filteredMarkets = filteredMarkets.filter(
              (market) =>
                market.question.toLowerCase().includes(searchLower) ||
                market.description?.toLowerCase().includes(searchLower) ||
                market.creator.toLowerCase().includes(searchLower),
            );
          }

          filteredMarkets.sort((a, b) => {
            switch (sortBy) {
              case "probability":
                return (b.probability || 50) - (a.probability || 50);
              case "volume":
                return parseFloat(b.volume) - parseFloat(a.volume);
              case "endDate":
                return (
                  new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
                );
              case "createdAt":
              default:
                return (
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
                );
            }
          });

          setMarkets(filteredMarkets);
          setTotal(response.meta.total);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load markets";

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, searchTerm, sortBy],
  );

  useEffect(() => {
    loadMarkets(currentPage);
  }, [loadMarkets, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    loadMarkets(currentPage);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const getStatusChip = (market: Market) => {
    const isActive = marketUtils.isMarketActive(market);
    const color = marketUtils.getStatusColor(market.status);

    let status = market.status;

    if (market.isResolved) status = "Resolved";
    else if (!isActive) status = "Ended";

    return (
      <Chip color={color as any} size="sm" variant="flat">
        {status}
      </Chip>
    );
  };

  const getProbabilityBar = (market: Market) => {
    const probability = market.probability || 50;

    return (
      <div className="flex items-center gap-2 w-full">
        <Progress
          className="flex-1"
          color={
            probability > 70
              ? "success"
              : probability < 30
                ? "danger"
                : "warning"
          }
          size="sm"
          value={probability}
        />
        <span className="text-xs font-medium min-w-10">
          {marketUtils.formatProbability(probability)}
        </span>
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500">
            Error Loading Markets
          </h2>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
        <Button
          color="primary"
          startContent={<SwatchIcon className="w-4 h-4" />}
          variant="flat"
          onClick={handleRefresh}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Prediction Markets</h1>
          <p className="text-gray-600">
            Browse and participate in active prediction markets
          </p>
        </div>
        <Button
          color="primary"
          isLoading={loading}
          startContent={<SwatchIcon className="w-4 h-4" />}
          variant="flat"
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="flex gap-4 items-end">
            <Input
              className="flex-1"
              placeholder="Search markets..."
              startContent={<SearchIcon className="w-4 h-4 text-gray-400" />}
              value={searchTerm}
              onValueChange={handleSearchChange}
            />
            <Select
              className="min-w-[150px]"
              label="Status"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
            >
              <SelectItem key="all">All Markets</SelectItem>
              <SelectItem key="active">Active</SelectItem>
              <SelectItem key="resolved">Resolved</SelectItem>
              <SelectItem key="expired">Expired</SelectItem>
            </Select>
            <Select
              className="min-w-[150px]"
              label="Sort by"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <SelectItem key="createdAt">Recently Created</SelectItem>
              <SelectItem key="probability">Probability</SelectItem>
              <SelectItem key="volume">Volume</SelectItem>
              <SelectItem key="endDate">Ending Soon</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold">Markets</h2>
            <div className="text-sm text-gray-600">{total} total markets</div>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          ) : markets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No markets found</p>
            </div>
          ) : (
            <Table aria-label="Markets table">
              <TableHeader>
                <TableColumn>Question</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Probability</TableColumn>
                <TableColumn>Volume</TableColumn>
                <TableColumn>Ends</TableColumn>
                <TableColumn>Bets</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {markets.map((market) => (
                  <TableRow key={market.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Link
                          className="font-medium text-sm hover:text-blue-600"
                          href={`/dashboard/markets/${market.id}`}
                        >
                          {market.question}
                        </Link>
                        {market.protocol && (
                          <div className="text-xs text-gray-500">
                            {market.protocol.displayName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusChip(market)}</TableCell>
                    <TableCell>{getProbabilityBar(market)}</TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {marketUtils.formatVolume(market.volume)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {marketUtils.getTimeRemaining(market.endDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{market._count?.bets || 0}</div>
                    </TableCell>
                    <TableCell>
                      <Button
                        as={Link}
                        color="primary"
                        href={`/dashboard/markets/${market.id}`}
                        size="sm"
                        variant="flat"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {total > ITEMS_PER_PAGE && (
        <div className="flex justify-center">
          <Pagination
            showControls
            showShadow
            color="primary"
            page={currentPage}
            total={Math.ceil(total / ITEMS_PER_PAGE)}
            onChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
