/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromB64 } from '@mysten/sui/utils';
import dotenv from 'dotenv';

dotenv.config();

const NETWORK = process.env.SUI_NETWORK || 'testnet';
const RPC_URL =
  process.env.SUI_RPC_URL ||
  getFullnodeUrl(NETWORK as 'testnet' | 'mainnet' | 'devnet');

export const suiClient = new SuiClient({ url: RPC_URL });

export const getKeypair = (): Ed25519Keypair => {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable not set');
  }

  let keyBytes: Uint8Array;
  if (privateKey.startsWith('suiprivkey1')) {
    const cleanKey = privateKey.replace('suiprivkey1', '');
    const decoded = fromB64(cleanKey);

    keyBytes = decoded.slice(-32);
  } else {
    keyBytes = fromB64(privateKey);
  }

  if (keyBytes.length !== 32) {
    throw new Error(
      `Invalid private key length. Expected 32 bytes, got ${keyBytes.length}`
    );
  }

  return Ed25519Keypair.fromSecretKey(keyBytes);
};

export const getSignerAddress = (): string => {
  const keypair = getKeypair();
  return keypair.getPublicKey().toSuiAddress();
};

export interface CreateMarketParams {
  question: string;
  description?: string;
  duration: number;
}

export interface CreateMarketResult {
  marketId: string;
  txDigest: string;
  effects: any;
}

/**
 * Create a new prediction market on Sui blockchain
 */
export const createMarket = async (
  params: CreateMarketParams,
  retries = 3
): Promise<CreateMarketResult> => {
  const keypair = getKeypair();
  const packageId = process.env.PROPHYT_PACKAGE_ID;
  const marketStateId = process.env.MARKET_STATE_OBJECT_ID;
  const coinType = process.env.PROPHYT_COIN_TYPE || '0x2::sui::SUI';

  if (!packageId || !marketStateId) {
    throw new Error(
      'Missing required environment variables for Prophyt contract'
    );
  }

  let lastError: any;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${packageId}::prediction_market::create_market`,
        arguments: [
          tx.object(marketStateId),
          tx.pure.string(params.question),
          tx.pure.string(params.description || ''),
          tx.pure.u64(params.duration),
          tx.object('0x6'),
        ],
        typeArguments: [coinType],
      });

      const result = await suiClient.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(
          `Failed to create market: ${result.effects?.status?.error}`
        );
      }

      const createdObjects =
        result.objectChanges?.filter(
          (change: any) => change.type === 'created' && 'objectId' in change
        ) || [];

      const marketObject = createdObjects.find((obj: any) =>
        obj.objectType?.includes('prediction_market::Market')
      );

      if (!marketObject || !('objectId' in marketObject)) {
        throw new Error('Market object not found in transaction result');
      }

      return {
        marketId: (marketObject as any).objectId,
        txDigest: result.digest,
        effects: result.effects,
      };
    } catch (error) {
      lastError = error;
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg.includes('is not available for consumption')) {
        if (attempt < retries - 1) {
          console.log(
            `   ⏳ Stale coin, retrying (${attempt + 1}/${retries - 1})...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1))
          );
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
};

export interface PlaceBetParams {
  marketId: string;
  position: boolean;
  amount: number;
  betProofBlobAddress: string;
  imageUrl: string;
  imageBlobId: string;
}

export interface PlaceBetResult {
  betId: string;
  txDigest: string;
}

/**
 * Place a bet on a market
 */
export const placeBet = async (
  params: PlaceBetParams
): Promise<PlaceBetResult> => {
  const keypair = getKeypair();
  const packageId = process.env.PROPHYT_PACKAGE_ID;
  const coinType = process.env.PROPHYT_COIN_TYPE || '0x2::sui::SUI';

  if (!packageId) {
    throw new Error('PROPHYT_PACKAGE_ID environment variable not set');
  }

  const tx = new Transaction();

  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(params.amount)]);

  const stateId = process.env.MARKET_STATE_OBJECT_ID;
  const registryId = process.env.PROPHYT_REGISTRY_ID;
  const suilendStateId = process.env.PROPHYT_SUILEND_STATE_ID;
  const haedalStateId = process.env.PROPHYT_HAEDAL_STATE_ID;
  const voloStateId = process.env.PROPHYT_VOLO_STATE_ID;

  if (
    !stateId ||
    !registryId ||
    !suilendStateId ||
    !haedalStateId ||
    !voloStateId
  ) {
    throw new Error('Missing required state IDs for place_bet');
  }

  tx.moveCall({
    target: `${packageId}::prediction_market::place_bet`,
    arguments: [
      tx.object(stateId),
      tx.object(registryId),
      tx.object(suilendStateId),
      tx.object(haedalStateId),
      tx.object(voloStateId),
      tx.pure.u64(params.marketId),
      tx.pure.bool(params.position),
      coin,
      tx.pure.address(params.betProofBlobAddress),
      tx.pure.string(params.imageUrl),
      tx.pure.string(params.imageBlobId),
      tx.object('0x6'),
    ],
    typeArguments: [coinType],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
    },
  });

  if (result.effects?.status?.status !== 'success') {
    throw new Error(`Failed to place bet: ${result.effects?.status?.error}`);
  }

  const createdObjects =
    result.objectChanges?.filter(
      (change: any) => change.type === 'created' && 'objectId' in change
    ) || [];

  const betObject = createdObjects.find((obj: any) =>
    obj.objectType?.includes('prediction_market::Bet')
  );

  if (!betObject || !('objectId' in betObject)) {
    throw new Error('Bet object not found in transaction result');
  }

  return {
    betId: (betObject as any).objectId,
    txDigest: result.digest,
  };
};

/**
 * Resolve a market with outcome
 */
export const resolveMarket = async (
  marketId: string,
  outcome: boolean
): Promise<string> => {
  const keypair = getKeypair();
  const packageId = process.env.PROPHYT_PACKAGE_ID;
  const coinType = process.env.PROPHYT_COIN_TYPE || '0x2::sui::SUI';

  if (!packageId) {
    throw new Error('PROPHYT_PACKAGE_ID environment variable not set');
  }

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::prediction_market::resolve_market`,
    arguments: [tx.object(marketId), tx.pure.bool(outcome)],
    typeArguments: [coinType],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  if (result.effects?.status?.status !== 'success') {
    throw new Error(
      `Failed to resolve market: ${result.effects?.status?.error}`
    );
  }

  return result.digest;
};

export interface ResolveMarketWithNautilusParams {
  marketId: string;
  resolution: {
    market_id: number;
    outcome: boolean;
    source_data: string;
    source_data_hash: string;
    resolution_timestamp: number;
    media_hash: string;
  };
  signature: string;
  enclave_public_key: string;
}

/**
 * Resolve a market using Nautilus Trust Oracle verification
 * This function submits a Nautilus-verified resolution to the blockchain
 */
export const resolveMarketWithNautilus = async (
  params: ResolveMarketWithNautilusParams
): Promise<string> => {
  const keypair = getKeypair();
  const packageId = process.env.PROPHYT_PACKAGE_ID;
  const nautilusRegistryId = process.env.NAUTILUS_REGISTRY_ID;
  const coinType = process.env.PROPHYT_COIN_TYPE || '0x2::sui::SUI';

  if (!packageId || !nautilusRegistryId) {
    throw new Error(
      'PROPHYT_PACKAGE_ID and NAUTILUS_REGISTRY_ID environment variables must be set'
    );
  }

  const stateId = process.env.MARKET_STATE_OBJECT_ID;
  const registryId = process.env.PROPHYT_REGISTRY_ID;
  const suilendStateId = process.env.PROPHYT_SUILEND_STATE_ID;
  const haedalStateId = process.env.PROPHYT_HAEDAL_STATE_ID;
  const voloStateId = process.env.PROPHYT_VOLO_STATE_ID;

  if (
    !stateId ||
    !registryId ||
    !suilendStateId ||
    !haedalStateId ||
    !voloStateId
  ) {
    throw new Error(
      'Missing required state IDs for resolve_market_with_nautilus'
    );
  }

  // Convert hex strings to Uint8Array
  const { fromHex } = await import('@mysten/sui/utils');
  const sourceDataHash = fromHex(params.resolution.source_data_hash);
  const signature = fromHex(params.signature);
  const enclavePublicKey = fromHex(params.enclave_public_key);
  const mediaHash = fromHex(params.resolution.media_hash);

  const tx = new Transaction();

  // Call resolve_market_with_nautilus with individual fields
  tx.moveCall({
    target: `${packageId}::prediction_market::resolve_market_with_nautilus`,
    arguments: [
      tx.object(stateId),
      tx.object(nautilusRegistryId),
      tx.object(registryId),
      tx.object(suilendStateId),
      tx.object(haedalStateId),
      tx.object(voloStateId),
      // Use the market_id from resolution (which is numeric)
      // But we need to get the actual blockchain market ID from the params
      tx.pure.u64(params.resolution.market_id),
      tx.pure.bool(params.resolution.outcome),
      tx.pure.string(params.resolution.source_data),
      tx.pure.vector('u8', Array.from(sourceDataHash)),
      tx.pure.u64(params.resolution.resolution_timestamp),
      tx.pure.vector('u8', Array.from(mediaHash)),
      tx.pure.vector('u8', Array.from(signature)),
      tx.pure.vector('u8', Array.from(enclavePublicKey)),
      tx.object('0x6'), // Clock
    ],
    typeArguments: [coinType],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  if (result.effects?.status?.status !== 'success') {
    throw new Error(
      `Failed to resolve market with Nautilus: ${result.effects?.status?.error}`
    );
  }

  return result.digest;
};

export interface ClaimWinningsParams {
  marketId: string;
  betIndex: number;
  winningProofBlobAddress: string;
  imageUrl: string;
  imageBlobId: string;
}

/**
 * Claim winnings from a bet
 */
export const claimWinnings = async (
  params: ClaimWinningsParams
): Promise<string> => {
  const keypair = getKeypair();
  const packageId = process.env.PROPHYT_PACKAGE_ID;
  const coinType = process.env.PROPHYT_COIN_TYPE || '0x2::sui::SUI';

  if (!packageId) {
    throw new Error('PROPHYT_PACKAGE_ID environment variable not set');
  }

  const stateId = process.env.MARKET_STATE_OBJECT_ID;
  const registryId = process.env.PROPHYT_REGISTRY_ID;
  const suilendStateId = process.env.PROPHYT_SUILEND_STATE_ID;
  const haedalStateId = process.env.PROPHYT_HAEDAL_STATE_ID;
  const voloStateId = process.env.PROPHYT_VOLO_STATE_ID;

  if (
    !stateId ||
    !registryId ||
    !suilendStateId ||
    !haedalStateId ||
    !voloStateId
  ) {
    throw new Error('Missing required state IDs for claim_winnings');
  }

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::prediction_market::claim_winnings`,
    arguments: [
      tx.object(stateId),
      tx.object(registryId),
      tx.object(suilendStateId),
      tx.object(haedalStateId),
      tx.object(voloStateId),
      tx.pure.u64(params.marketId),
      tx.pure.u64(params.betIndex),
      tx.pure.address(params.winningProofBlobAddress),
      tx.pure.string(params.imageUrl),
      tx.pure.string(params.imageBlobId),
      tx.object('0x6'),
    ],
    typeArguments: [coinType],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
    },
  });

  if (result.effects?.status?.status !== 'success') {
    throw new Error(
      `Failed to claim winnings: ${result.effects?.status?.error}`
    );
  }

  return result.digest;
};

/**
 * Get market object from blockchain
 */
export const getMarketObject = async (marketId: string) => {
  return await suiClient.getObject({
    id: marketId,
    options: {
      showContent: true,
      showType: true,
    },
  });
};

/**
 * Get bet object from blockchain
 */
export const getBetObject = async (betId: string) => {
  return await suiClient.getObject({
    id: betId,
    options: {
      showContent: true,
      showType: true,
    },
  });
};
