import { CONFIG } from '../config';
import { prophytEventHandler } from '../indexer/prophyt-handler';

const prophytEventTypes = [
  'prediction_market::MarketCreated',
  'prediction_market::BetPlaced',
  'prediction_market::MarketResolved',
  'prediction_market::WinningsClaimed',
  'prediction_market::YieldDeposited',
  'walrus_proof_nft::BetProofNFTMinted',
  'walrus_proof_nft::WinningProofNFTMinted',
  'nautilus_oracle::NautilusMarketResolved',
] as const;

export const prophytEventSubscriptions = prophytEventTypes.map((eventType) => {
  const parts = eventType.split('::');
  const module = parts[0];
  const eventName = parts[1];
  const packageId = CONFIG.PROPHYT_CONTRACT;

  return {
    type: eventType,
    filter: {
      MoveEventType: `${packageId}::${module}::${eventName}`,
    },
    callback: prophytEventHandler,
  };
});
