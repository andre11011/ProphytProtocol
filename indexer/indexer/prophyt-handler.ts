/* eslint-disable @typescript-eslint/no-explicit-any */
import { SuiEvent } from '@mysten/sui/client';
import {
  handleMarketCreated,
  handleBetPlaced,
  handleMarketResolved,
  handleWinningsClaimed,
  handleYieldDeposited,
  handleBetProofNFTMinted,
  handleWinningProofNFTMinted,
  handleNautilusMarketResolved,
  MarketCreatedEventData,
  BetPlacedEventData,
  MarketResolvedEventData,
  WinningsClaimedEventData,
  YieldDepositedEventData,
  BetProofNFTMintedEventData,
  WinningProofNFTMintedEventData,
  NautilusMarketResolvedEventData,
} from '../helpers/prophyt-indexer';

export const prophytEventHandler = async (events: SuiEvent[], type: string) => {
  console.log(`[${type}] Processing ${events.length} events`);

  const toUpsert: Promise<any>[] = [];

  for (const event of events) {
    console.log(
      `[${type}] Checking event type: ${event.type} vs filter: ${type}`
    );
    if (!event.type.endsWith(type)) {
      console.log(`[${type}] Event type mismatch, skipping`);
      continue;
    }

    console.log(`[${type}] Event type matched: ${event.type}`);

    if (event.type.endsWith('::prediction_market::MarketCreated')) {
      console.log('[MarketCreated] Handling event:', event.parsedJson);
      toUpsert.push(
        handleMarketCreated(event, event.parsedJson as MarketCreatedEventData)
      );
      continue;
    }

    if (event.type.endsWith('::prediction_market::BetPlaced')) {
      console.log('[BetPlaced] Handling event:', event.parsedJson);
      toUpsert.push(
        handleBetPlaced(event, event.parsedJson as BetPlacedEventData)
      );
      continue;
    }

    if (event.type.endsWith('::prediction_market::MarketResolved')) {
      console.log('[MarketResolved] Handling event:', event.parsedJson);
      toUpsert.push(
        handleMarketResolved(event, event.parsedJson as MarketResolvedEventData)
      );
      continue;
    }

    if (event.type.endsWith('::prediction_market::WinningsClaimed')) {
      console.log('[WinningsClaimed] Handling event:', event.parsedJson);
      toUpsert.push(
        handleWinningsClaimed(
          event,
          event.parsedJson as WinningsClaimedEventData
        )
      );
      continue;
    }

    if (event.type.endsWith('::prediction_market::YieldDeposited')) {
      console.log('[YieldDeposited] Handling event:', event.parsedJson);
      toUpsert.push(
        handleYieldDeposited(event, event.parsedJson as YieldDepositedEventData)
      );
      continue;
    }

    if (event.type.endsWith('::walrus_proof_nft::BetProofNFTMinted')) {
      console.log('[BetProofNFTMinted] Handling event:', event.parsedJson);
      toUpsert.push(
        handleBetProofNFTMinted(
          event,
          event.parsedJson as BetProofNFTMintedEventData
        )
      );
      continue;
    }

    if (event.type.endsWith('::walrus_proof_nft::WinningProofNFTMinted')) {
      console.log('[WinningProofNFTMinted] Handling event:', event.parsedJson);
      toUpsert.push(
        handleWinningProofNFTMinted(
          event,
          event.parsedJson as WinningProofNFTMintedEventData
        )
      );
      continue;
    }

    if (event.type.endsWith('::nautilus_oracle::NautilusMarketResolved')) {
      console.log('[NautilusMarketResolved] Handling event:', event.parsedJson);
      toUpsert.push(
        handleNautilusMarketResolved(
          event,
          event.parsedJson as NautilusMarketResolvedEventData
        )
      );
      continue;
    }
  }

  console.log(`[${type}] Saving ${toUpsert.length} events to database`);
  if (toUpsert.length) {
    try {
      await Promise.all(toUpsert);
      console.log(`[${type}] Successfully saved events`);
    } catch (e) {
      console.error(`[${type}] Error saving events:`, e);
    }
  }
};
