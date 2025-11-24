"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useNetworkVariable } from "../../lib/sui";

import { betService } from "@/services/bet.service";
import {
  CLOCK_ID,
  PROPHYT_HAEDAL_STATE_ID,
  PROPHYT_MARKET_STATE_OBJECT_ID,
  PROPHYT_REGISTRY_OBJECT_ID,
  PROPHYT_SUILEND_STATE_ID,
  PROPHYT_VOLO_STATE_ID,
} from "@/lib/contracts";

interface PlaceBetParams {
  marketId: string;
  blockchainMarketId: number;
  question: string;
  position: boolean;
  amount: string | number;
}

export function usePlaceBet() {
  const currentAccount = useCurrentAccount();
  const userAddress = currentAccount?.address;

  const prophytPackageId = useNetworkVariable("prophytPackageId");
  const suiClient = useSuiClient();
  const queryClient = useQueryClient();

  const { mutate: signAndExecute, isPending: isExecuting } =
    useSignAndExecuteTransaction();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const placeBet = async (params: PlaceBetParams) => {
    const { marketId, blockchainMarketId, question, position, amount } = params;

    if (!prophytPackageId) throw new Error("Package ID not defined");
    if (!userAddress) throw new Error("You must be connected");
    if (!marketId || !question || !amount)
      throw new Error("Invalid parameters");

    try {
      setIsGenerating(true);
      setError(null);

      const formattedAmount =
        typeof amount === "string" ? parseFloat(amount) : amount;

      const mistAmount = Math.floor(formattedAmount * 1e9);

      if (mistAmount <= 0) {
        throw new Error("Amount too small — minimum ≈ 0.001 SUI");
      }

      const response = await betService.generateBetImage({
        marketId,
        question,
        position,
        amount: formattedAmount.toString(),
      });

      if (!response.success || !response.data) {
        throw new Error("Failed to generate bet image");
      }

      const { imageUrl, imageBlobId } = response.data;

      setIsGenerating(false);

      const tx = new Transaction();

      const [betCoin] = tx.splitCoins(tx.gas, [mistAmount]);

      tx.moveCall({
        target: `${prophytPackageId}::prediction_market::place_bet`,
        typeArguments: ["0x2::sui::SUI"],
        arguments: [
          tx.object(PROPHYT_MARKET_STATE_OBJECT_ID),
          tx.object(PROPHYT_REGISTRY_OBJECT_ID),
          tx.object(PROPHYT_SUILEND_STATE_ID),
          tx.object(PROPHYT_HAEDAL_STATE_ID),
          tx.object(PROPHYT_VOLO_STATE_ID),
          tx.pure.u64(blockchainMarketId),
          tx.pure.bool(position),
          betCoin,
          tx.pure.address(userAddress),
          tx.pure.string(imageUrl),
          tx.pure.string(imageBlobId),
          tx.object(CLOCK_ID),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            suiClient.waitForTransaction({ digest: result.digest }).then(() => {
              queryClient.invalidateQueries({ queryKey: ["market"] });
              queryClient.invalidateQueries({ queryKey: ["markets"] });
              queryClient.invalidateQueries({ queryKey: ["chart"] });
            });

            setIsSuccess(true);
            setTransactionId(result.digest);
          },

          onError: (err) => {
            setError(
              err instanceof Error ? err.message : "Failed to place bet",
            );
          },
        },
      );
    } catch (err) {
      setIsGenerating(false);
      const msg = err instanceof Error ? err.message : "Failed to place bet";

      setError(msg);
      throw err;
    }
  };

  return {
    placeBet,
    isPending: isExecuting || isGenerating,
    error,
    isSuccess,
    transactionId,
  };
}
