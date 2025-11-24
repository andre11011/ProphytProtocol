"use client";
import {
  Card,
  CardBody,
  Chip,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { formatDistanceToNow } from "date-fns";

import { useMarketBets } from "@/hooks/queries/use-bet";
import { formatNumber } from "@/lib/helper/number";

interface MarketActivityProps {
  marketId: string;
}

export default function MarketActivity({ marketId }: MarketActivityProps) {
  const { data: betsResponse, isLoading } = useMarketBets(marketId.toString(), {
    limit: 50,
    offset: 0,
  });

  const bets = betsResponse?.data || [];

  const formatAddress = (address: string) => {
    if (address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    return `@${address}`;
  };

  return (
    <Card className="border-2 border-default-200">
      <CardBody className="p-6">
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
          Market Activity
        </h2>
        <Table
          aria-label="Market activity table"
          classNames={{
            base: "max-h-[400px]",
            wrapper: "border border-neutral-400",
          }}
        >
          <TableHeader>
            <TableColumn>User</TableColumn>
            <TableColumn>Option</TableColumn>
            <TableColumn>Amount</TableColumn>
            <TableColumn>Time</TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={"No activity yet"}
            isLoading={isLoading}
            items={bets}
            loadingContent={<Spinner color="white" />}
          >
            {(bet: any) => {
              const userId = bet.bettor;
              const position = bet.position;
              const selectedOption = bet.selectedOption;
              const amount = bet.amount / 1e9;
              const placedAt = bet.placedAt;

              return (
                <TableRow key={bet.ID || bet.id}>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {formatAddress(userId)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      className="capitalize"
                      color={
                        position === true || selectedOption === "YES"
                          ? "success"
                          : "danger"
                      }
                      size="sm"
                      variant="flat"
                    >
                      {position === true || selectedOption === "YES"
                        ? "YES"
                        : "NO"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      {formatNumber(parseFloat(String(amount) || "0"), {
                        decimals: 2,
                        thousandSeparator: ",",
                        suffix: " SUI",
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-neutral-400">
                      {placedAt
                        ? formatDistanceToNow(new Date(placedAt), {
                            addSuffix: true,
                          })
                        : "-"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
