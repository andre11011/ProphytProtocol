"use client";

import type { ThemeProviderProps } from "next-themes";

import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@heroui/react";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";

import { networkConfig } from "@/lib/sui";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

const queryClient = new QueryClient();

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider defaultNetwork="testnet" networks={networkConfig}>
        <WalletProvider autoConnect>
          <HeroUIProvider navigate={router.push}>
            <ToastProvider
              toastProps={{
                color: "primary",
                variant: "flat",
                timeout: 2000,
                hideIcon: true,
                classNames: {
                  closeButton:
                    "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
                },
              }}
            />
            <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
          </HeroUIProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
