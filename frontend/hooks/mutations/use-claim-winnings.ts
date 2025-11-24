"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
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

interface ClaimWinningsParams {
  marketId: string;
  blockchainMarketId: number;
  betIndex: string | number;
  betId: string;
  winningAmount: string | number;
  betAmount: string | number;
}

export function useClaimWinnings() {
  const currentAccount = useCurrentAccount();
  const userAddress = currentAccount?.address;
  const prophytPackageId = useNetworkVariable("prophytPackageId");
  const suiClient = useSuiClient();
  const { mutate: signAndExecute, isPending: isExecuting } =
    useSignAndExecuteTransaction();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimWinnings = async (params: ClaimWinningsParams) => {
    const {
      marketId,
      blockchainMarketId,
      betIndex,
      betId,
      winningAmount,
      betAmount,
    } = params;

    if (!prophytPackageId) {
      throw new Error(
        "Prophyt package ID is not defined for the current network",
      );
    }

    if (!marketId || !betIndex || !betId || !winningAmount || !betAmount) {
      throw new Error("Missing required parameters for claiming winnings");
    }

    if (!userAddress) {
      throw new Error("You must be connected to place a bet");
    }

    try {
      setIsGenerating(true);
      setError(null);

      const response = await betService.generateWinningImage({
        marketId,
        betId,
        winningAmount,
        betAmount,
      });

      if (!response.success || !response.data) {
        throw new Error("Failed to generate winning image");
      }

      const { imageUrl, imageBlobId } = response.data;

      setIsGenerating(false);

      const tx = new Transaction();

      tx.moveCall({
        target: `${prophytPackageId}::prediction_market::claim_winnings`,
        typeArguments: ["0x2::sui::SUI"],
        arguments: [
          tx.object(PROPHYT_MARKET_STATE_OBJECT_ID),
          tx.object(PROPHYT_REGISTRY_OBJECT_ID),
          tx.object(PROPHYT_SUILEND_STATE_ID),
          tx.object(PROPHYT_HAEDAL_STATE_ID),
          tx.object(PROPHYT_VOLO_STATE_ID),
          tx.pure.u64(blockchainMarketId),
          tx.pure.u64(betIndex),
          tx.pure.address(userAddress),
          tx.pure.string(imageUrl),
          tx.pure.string(imageBlobId),
          tx.object(CLOCK_ID),
        ],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            suiClient
              .waitForTransaction({ digest: result.digest })
              .then(() => {});
          },
          onError: (err) => {
            setError(
              err instanceof Error ? err.message : "Failed to claim winnings",
            );
          },
        },
      );
    } catch (err) {
      setIsGenerating(false);
      const message =
        err instanceof Error ? err.message : "Failed to claim winnings";

      setError(message);
      throw err;
    }
  };

  return {
    claimWinnings,
    isPending: isExecuting || isGenerating,
    error,
  };
}
