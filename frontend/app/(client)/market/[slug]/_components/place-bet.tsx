"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
  addToast,
} from "@heroui/react";
import { Info, CheckCircle2 } from "lucide-react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

import { formatNumber } from "@/lib/helper/number";
import { Market } from "@/types/market.types";
import { usePlaceBet } from "@/hooks/mutations/use-place-bet";
import { useLatestPrice } from "@/hooks/queries/use-price";
import { useSuiBalance } from "@/hooks/queries/use-sui-balance";

interface PlaceBetProps {
  market?: Market;
  isLoading: boolean;
}

export function PlaceBet({ market, isLoading }: PlaceBetProps) {
  const currentAccount = useCurrentAccount();
  const userAddress = currentAccount?.address;
  const { placeBet, isPending, isSuccess, error, transactionId } =
    usePlaceBet();
  const {
    balance,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useSuiBalance();
  const { data: priceData } = useLatestPrice({ symbol: "SUI" });

  const [betAmount, setBetAmount] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<boolean | null>(
    null,
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successBetDetails, setSuccessBetDetails] = useState<{
    amount: string;
    position: boolean;
    potentialProfit: number;
  } | null>(null);

  const calculateMetrics = () => {
    const amount = parseFloat(betAmount) || 0;

    if (amount <= 0 || selectedPosition === null || !market) {
      return {
        odds: 1,
        estimatedPayout: 0,
        potentialProfit: 0,
        estimatedYield: 0,
      };
    }

    const yesProbability = (market.probability || 0) / 100;
    const noProbability = 1 - yesProbability;

    const probability = selectedPosition ? yesProbability : noProbability;

    const minProbability = 0.01;
    const safeProbability = Math.max(probability, minProbability);
    const odds = 1 / safeProbability;

    const estimatedPayout = amount * odds;

    const baseApy = parseFloat(market.protocol?.apy || "0") / 100;

    const now = new Date();
    const endDate = new Date(market.endDate);
    const daysUntilEnd = Math.max(
      0,
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    const estimatedYield = amount * baseApy * (daysUntilEnd / 365);

    const potentialProfit = estimatedPayout - amount + estimatedYield;

    return {
      odds: odds,
      estimatedPayout: estimatedPayout,
      potentialProfit: potentialProfit,
      estimatedYield: estimatedYield,
    };
  };

  const calculations = calculateMetrics();

  useEffect(() => {
    if (isSuccess && selectedPosition !== null && betAmount) {
      const t = setTimeout(() => {
        setSuccessBetDetails({
          amount: betAmount,
          position: selectedPosition,
          potentialProfit: calculations.potentialProfit,
        });
        setShowSuccessModal(true);
        setBetAmount("");
        setSelectedPosition(null);

        refetchBalance();
      }, 0);

      return () => clearTimeout(t);
    }
  }, [
    isSuccess,
    refetchBalance,
    betAmount,
    selectedPosition,
    calculations.potentialProfit,
  ]);

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/,/g, "").replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");

    if (parts.length > 2) return;

    setBetAmount(cleaned);
  };

  const formatDisplayValue = (value: string) => {
    if (!value) return "";

    const parts = value.split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const decimalPart = parts[1] !== undefined ? `.${parts[1]}` : "";

    return integerPart + decimalPart;
  };

  const handlePlaceBet = () => {
    if (!userAddress) {
      addToast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        color: "danger",
      });

      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      addToast({
        title: "Invalid Bet Amount",
        description: "Please enter a valid bet amount",
        color: "danger",
      });

      return;
    }

    if (selectedPosition === null) {
      addToast({
        title: "Invalid Bet Position",
        description: "Please select YES or NO",
        color: "danger",
      });

      return;
    }

    if (!market) {
      addToast({
        title: "Market Data Not Available",
        description: "Market data is not available",
        color: "danger",
      });

      return;
    }

    const betAmountNum = parseFloat(betAmount);

    if (balance < betAmountNum) {
      addToast({
        title: "Insufficient Balance",
        description: `You have ${balance.toFixed(
          2,
        )} SUI but need ${betAmountNum.toFixed(2)} SUI`,
        color: "danger",
      });

      return;
    }

    placeBet({
      marketId: market.marketId,
      blockchainMarketId: Number(market.blockchainMarketId),
      question: market.question,
      position: selectedPosition,
      amount: betAmountNum,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 w-full">
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
        <Card className="border border-neutral-400 shadow-none">
          <CardBody className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
            </div>
          </CardBody>
        </Card>
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-2 border-default-200">
        <CardBody className="p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Place Bet</span>
              <span className="text-xs text-neutral-500">
                Balance:{" "}
                {balanceLoading
                  ? "..."
                  : `${formatNumber(balance, {
                      decimals: 0,
                      thousandSeparator: ",",
                    })} SUI`}
              </span>
            </div>
            <Input
              classNames={{
                input: "text-3xl font-semibold",
                inputWrapper: "bg-transparent border-0 shadow-none px-0",
              }}
              placeholder="0.00"
              size="lg"
              type="text"
              value={formatDisplayValue(betAmount)}
              variant="faded"
              onChange={(e) => handleAmountChange(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">
                {betAmount && priceData?.data.price
                  ? `≈ ${formatNumber(
                      parseFloat(betAmount) * priceData.data.price,
                      {
                        decimals: 2,
                        thousandSeparator: ",",
                        prefix: "$",
                      },
                    )}`
                  : "≈ $0.00"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  className={`h-7 px-3 min-w-0 font-semibold text-xs ${
                    selectedPosition === true
                      ? "bg-blue-600 text-white"
                      : "bg-blue-600/10 text-blue-500 border border-blue-600/30"
                  }`}
                  size="sm"
                  onPress={() => setSelectedPosition(true)}
                >
                  YES
                </Button>
                <Button
                  className={`h-7 px-3 min-w-0 font-semibold text-xs ${
                    selectedPosition === false
                      ? "bg-red-600 text-white"
                      : "bg-red-600/10 text-red-500 border border-red-600/30"
                  }`}
                  size="sm"
                  onPress={() => setSelectedPosition(false)}
                >
                  NO
                </Button>
                <Button
                  className="h-7 px-3 min-w-0"
                  color="default"
                  size="sm"
                  variant="flat"
                  onPress={() => {
                    if (balance > 0) {
                      const maxAmount = Math.max(0, balance - 0.01);

                      setBetAmount(maxAmount.toFixed(8));
                    }
                  }}
                >
                  Max
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="border-2 border-default-200">
        <CardBody className="p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400 flex items-center gap-1">
                Odds
                <Info className="w-3 h-3" />
              </span>
              <span className="font-semibold">
                {calculations.odds.toFixed(2)}x
              </span>
            </div>

            {market && market.protocol && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Yield Protocol</span>
                <div className="flex items-center gap-1">
                  <Image
                    alt={market.protocol.name}
                    height={25}
                    src={market.protocol.iconUrl}
                    width={25}
                  />
                  <span className="capitalize font-medium whitespace-nowrap">
                    {market.protocol.name}
                  </span>
                </div>
              </div>
            )}

            {selectedPosition !== null &&
              market &&
              market.probability &&
              market.probability >= 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Current Probability</span>
                  <span className="font-semibold">
                    {selectedPosition && market.probability
                      ? market.probability.toFixed(1)
                      : (100 - (market.probability || 0)).toFixed(1)}
                    %
                  </span>
                </div>
              )}

            {selectedPosition !== null && calculations.estimatedPayout > 0 && (
              <>
                <div className="h-px bg-neutral-800 my-2" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Estimated Payout</span>
                  <span className="font-semibold">
                    {priceData?.data.price
                      ? formatNumber(
                          calculations.estimatedPayout * priceData.data.price,
                          {
                            decimals: 2,
                            thousandSeparator: ",",
                            prefix: "$",
                          },
                        )
                      : `${formatNumber(calculations.estimatedPayout, {
                          decimals: 0,
                          thousandSeparator: ",",
                        })} SUI`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Protocol Yield</span>
                  <span className="font-semibold">
                    {priceData?.data.price
                      ? formatNumber(
                          calculations.estimatedYield * priceData.data.price,
                          {
                            decimals: 2,
                            thousandSeparator: ",",
                            prefix: "$",
                          },
                        )
                      : `${formatNumber(calculations.estimatedYield, {
                          decimals: 0,
                          thousandSeparator: ",",
                        })} SUI`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Potential Profit</span>
                  <span
                    className={
                      calculations.potentialProfit > 0
                        ? "font-semibold text-green-500"
                        : "font-semibold text-neutral-500"
                    }
                  >
                    {calculations.potentialProfit > 0
                      ? priceData?.data.price
                        ? `+${formatNumber(
                            calculations.potentialProfit * priceData.data.price,
                            {
                              decimals: 2,
                              thousandSeparator: ",",
                              prefix: "$",
                            },
                          )}`
                        : `+${formatNumber(calculations.potentialProfit, {
                            decimals: 0,
                            thousandSeparator: ",",
                          })} SUI`
                      : "$0.00"}
                  </span>
                </div>
              </>
            )}

            {(selectedPosition === null ||
              !betAmount ||
              parseFloat(betAmount) <= 0) && (
              <div className="text-sm text-center text-neutral-500 py-4">
                Enter an amount and select YES or NO to see payout details
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {!userAddress ? (
        <div className="space-y-3">
          <div className="flex justify-center">
            <ConnectButton />
          </div>
          <p className="text-xs text-center text-neutral-500">
            Connect your wallet to place a bet
          </p>
        </div>
      ) : (
        selectedPosition !== null && (
          <>
            <Button
              className={`h-14 text-lg font-semibold ${
                selectedPosition === true
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
              disabled={!betAmount || parseFloat(betAmount) <= 0 || isPending}
              size="lg"
              onClick={handlePlaceBet}
            >
              {isPending
                ? "Placing Bet..."
                : `Place ${selectedPosition ? "YES" : "NO"} Bet`}
            </Button>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">
                  Transaction failed. Please try again.
                </p>
              </div>
            )}
          </>
        )
      )}

      <Modal
        isOpen={showSuccessModal}
        placement="center"
        size="md"
        onOpenChange={setShowSuccessModal}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <span>Bet Placed Successfully!</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Amount</span>
                    <span className="font-semibold">
                      {formatNumber(
                        parseFloat(successBetDetails?.amount || "0"),
                        {
                          decimals: 2,
                          thousandSeparator: ",",
                        },
                      )}{" "}
                      SUI
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Position</span>
                    <span
                      className={`font-semibold ${
                        successBetDetails?.position
                          ? "text-blue-500"
                          : "text-red-500"
                      }`}
                    >
                      {successBetDetails?.position ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Potential Profit</span>
                    <span className="font-semibold text-green-500">
                      {priceData?.data.price
                        ? formatNumber(
                            (successBetDetails?.potentialProfit || 0) *
                              priceData.data.price,
                            {
                              decimals: 2,
                              thousandSeparator: ",",
                              prefix: "+$",
                            },
                          )
                        : `+${formatNumber(
                            successBetDetails?.potentialProfit || 0,
                            {
                              decimals: 2,
                              thousandSeparator: ",",
                            },
                          )} SUI`}
                    </span>
                  </div>
                  {transactionId && (
                    <a
                      className="text-sm text-blue-500 hover:text-blue-400 underline hover:no-underline text-center"
                      href={`https://suiscan.xyz/testnet/tx/${transactionId}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      View on Suiscan
                    </a>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button className="w-full" color="primary" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
