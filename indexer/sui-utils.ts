import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

export type Network = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

export const ACTIVE_NETWORK = (process.env.NETWORK as Network) || 'testnet';

export const SUI_BIN = `sui`;

export const getActiveAddress = () => {
  return execSync(`${SUI_BIN} client active-address`, {
    encoding: 'utf8',
  }).trim();
};

export const getClient = (network: Network) => {
  const url = process.env.SUI_RPC_URL || getFullnodeUrl(network);
  return new SuiClient({ url });
};
