import {
  Market,
  MarketListResponse,
  MarketDetailResponse,
  MarketFilters,
  Bet,
  BettorStats,
} from "@/types/market";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_INDEXER_API_URL || "http://localhost:3002/api";

/**
 * Fetch markets with optional filters
 */
export async function getMarkets(
  filters?: MarketFilters,
): Promise<MarketListResponse> {
  const params = new URLSearchParams();

  if (filters?.status) params.set("status", filters.status);
  if (filters?.protocolId) params.set("protocolId", filters.protocolId);
  if (filters?.limit) params.set("limit", filters.limit.toString());
  if (filters?.offset) params.set("offset", filters.offset.toString());

  const url = `${API_BASE_URL}/markets${params.toString() ? `?${params.toString()}` : ""}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch markets: ${response.status} ${response.statusText}`,
      );
    }

    const data: MarketListResponse = await response.json();

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch a specific market by ID
 */
export async function getMarket(
  marketId: string,
): Promise<MarketDetailResponse> {
  const url = `${API_BASE_URL}/markets/${encodeURIComponent(marketId)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Market not found: ${marketId}`);
      }
      throw new Error(
        `Failed to fetch market: ${response.status} ${response.statusText}`,
      );
    }

    const data: MarketDetailResponse = await response.json();

    return data;
  } catch (error) {
    console.error("Error fetching market:", error);
    throw error;
  }
}

/**
 * Fetch bets for a specific market
 */
export async function getMarketBets(marketId: string): Promise<Bet[]> {
  const url = `${API_BASE_URL}/bets?marketId=${encodeURIComponent(marketId)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch market bets: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error fetching market bets:", error);

    return [];
  }
}

/**
 * Fetch bets for a specific bettor
 */
export async function getBettorBets(bettor: string): Promise<Bet[]> {
  const url = `${API_BASE_URL}/bets?bettor=${encodeURIComponent(bettor)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch bettor bets: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error fetching bettor bets:", error);

    return [];
  }
}

/**
 * Fetch bettor statistics
 */
export async function getBettorStats(
  bettor: string,
): Promise<BettorStats | null> {
  const url = `${API_BASE_URL}/users/${encodeURIComponent(bettor)}/stats`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch bettor stats: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error fetching bettor stats:", error);

    return null;
  }
}

/**
 * Fetch recent bets across all markets
 */
export async function getRecentBets(limit: number = 10): Promise<Bet[]> {
  const url = `${API_BASE_URL}/bets/recent?limit=${limit}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch recent bets: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error fetching recent bets:", error);

    return [];
  }
}

/**
 * Update market image
 */
export async function updateMarketImage(
  marketId: string,
  imageUrl: string,
): Promise<MarketDetailResponse> {
  const url = `${API_BASE_URL}/markets/${encodeURIComponent(marketId)}/image`;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(
        errorData.error ||
          `Failed to update market image: ${response.status} ${response.statusText}`,
      );
    }

    const data: MarketDetailResponse = await response.json();

    return data;
  } catch (error) {
    console.error("Error updating market image:", error);
    throw error;
  }
}

/**
 * Update market details
 */
export async function updateMarket(
  marketId: string,
  updateData: { imageUrl?: string; description?: string; rules?: string },
): Promise<MarketDetailResponse> {
  const url = `${API_BASE_URL}/markets/${encodeURIComponent(marketId)}`;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(
        errorData.error ||
          `Failed to update market: ${response.status} ${response.statusText}`,
      );
    }

    const data: MarketDetailResponse = await response.json();

    return data;
  } catch (error) {
    console.error("Error updating market:", error);
    throw error;
  }
}

/**
 * Utility functions for market data processing
 */
export const marketUtils = {
  /**
   * Format market volume for display
   */
  formatVolume: (volume: string): string => {
    const num = parseFloat(volume);

    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }

    return num.toFixed(2);
  },

  /**
   * Format probability as percentage
   */
  formatProbability: (probability?: number): string => {
    if (probability === undefined || probability === null) return "50%";

    return `${Math.round(probability)}%`;
  },

  /**
   * Get market status color
   */
  getStatusColor: (status: string): string => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "resolved":
        return "primary";
      case "expired":
        return "warning";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  },

  /**
   * Calculate time remaining until market end
   */
  getTimeRemaining: (endDate: string): string => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;

    return `${minutes}m`;
  },

  /**
   * Check if market is active
   */
  isMarketActive: (market: Market): boolean => {
    return (
      market.status === "active" &&
      !market.isResolved &&
      new Date(market.endDate) > new Date()
    );
  },

  /**
   * Get position name
   */
  getPositionName: (position: boolean): string => {
    return position ? "Yes" : "No";
  },

  /**
   * Calculate total pool size from bets
   */
  calculatePoolSize: (totalYesBets: string, totalNoBets: string): number => {
    return parseFloat(totalYesBets) + parseFloat(totalNoBets);
  },

  /**
   * Calculate implied probability from pool sizes
   */
  calculateImpliedProbability: (
    totalYesBets: string,
    totalNoBets: string,
  ): number => {
    const yesAmount = parseFloat(totalYesBets);
    const noAmount = parseFloat(totalNoBets);
    const total = yesAmount + noAmount;

    if (total === 0) return 50;

    return (yesAmount / total) * 100;
  },
};

/**
 * Error handling wrapper for API calls
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  fallback?: T,
): Promise<T | typeof fallback> {
  try {
    return await apiCall();
  } catch (error) {
    console.error("API call failed:", error);
    if (fallback !== undefined) return fallback;
    throw error;
  }
}
