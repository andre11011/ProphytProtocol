/**
 * Nautilus Trust Oracle Service
 *
 * This service interacts with the Nautilus enclave to get verifiable
 * market resolutions with cryptographic proof of authenticity.
 */

import axios from 'axios';

const NAUTILUS_SERVER_URL =
  process.env.NAUTILUS_SERVER_URL || 'http://localhost:8080';

export interface ResolutionRequest {
  market_id: number;
  market_question: string;
  market_end_time: number;
  data_source_url?: string;
  image_url?: string;
}

export interface ResolutionResponse {
  market_id: number;
  outcome: boolean;
  source_data: string;
  source_data_hash: string;
  resolution_timestamp: number;
  media_hash: string;
  signature: string;
  public_key: string;
}

/**
 * Request a verifiable market resolution from Nautilus enclave
 */
export async function requestMarketResolution(
  request: ResolutionRequest
): Promise<ResolutionResponse> {
  try {
    const response = await axios.post<ResolutionResponse>(
      `${NAUTILUS_SERVER_URL}/resolve`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Nautilus server error: ${error.message} - ${error.response?.data}`
      );
    }
    throw error;
  }
}

/**
 * Check if Nautilus server is healthy
 */
export async function checkNautilusHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${NAUTILUS_SERVER_URL}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('Nautilus health check failed:', error);
    return false;
  }
}

/**
 * Resolve a market using Nautilus Trust Oracle
 *
 * This function:
 * 1. Queries the Nautilus enclave for a verified resolution
 * 2. Returns the signed resolution data that can be submitted on-chain
 */
export async function resolveMarketWithNautilus(
  marketId: number,
  marketQuestion: string,
  marketEndTime: number,
  dataSourceUrl?: string,
  imageUrl?: string
): Promise<ResolutionResponse> {
  console.log(
    `🔍 Requesting Nautilus resolution for market ${marketId}: ${marketQuestion}`
  );

  const resolution = await requestMarketResolution({
    market_id: marketId,
    market_question: marketQuestion,
    market_end_time: marketEndTime,
    data_source_url: dataSourceUrl,
    image_url: imageUrl,
  });

  console.log(
    `✅ Nautilus resolution received for market ${marketId}: outcome=${resolution.outcome}`
  );
  console.log(`📝 Source: ${resolution.source_data}`);
  console.log(`🔐 Signature: ${resolution.signature.substring(0, 16)}...`);

  return resolution;
}
