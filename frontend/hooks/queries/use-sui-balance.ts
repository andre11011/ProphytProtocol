"use client";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";

export function useSuiBalance() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const address = currentAccount?.address;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sui-balance", address],
    queryFn: async () => {
      if (!address) return null;

      const balance = await suiClient.getBalance({
        owner: address,
        coinType: "0x2::sui::SUI",
      });

      return balance;
    },
    enabled: !!address,
    refetchInterval: 10000,
  });

  const balanceInSui = data?.totalBalance
    ? Number(data.totalBalance) / 1_000_000_000
    : 0;

  return {
    balance: balanceInSui,
    balanceRaw: data?.totalBalance || "0",
    isLoading,
    error,
    refetch,
    hasBalance: balanceInSui > 0,
    isConnected: !!address,
    coinObjectCount: data?.coinObjectCount || 0,
    coinType: data?.coinType || "0x2::sui::SUI",
  };
}
