import { Network } from './sui-utils';

import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  POLLING_INTERVAL_MS: 1000,
  CONCURRENCY_LIMIT: 1000,
  DEFAULT_LIMIT: 1000,
  NETWORK: (process.env.NETWORK as Network) || 'mainnet',
  PROPHYT_CONTRACT: process.env.PROPHYT_PACKAGE_ID,
};
