import { SuiEvent } from '@mysten/sui/client';
import { prisma } from '../db';
import { syncBetFromEvent, markBetClaimed } from '../services/bet-service';
import { syncMarketFromEvent } from '../services/market-service';
import { resolveMarket } from '../services/sui-client';

export type MarketCreatedEventData = {
  market_id: string;
  creator: string;
  question: string;
  end_time: string;
};

export type BetPlacedEventData = {
  bet_id: string;
  market_id: string;
  user: string;
  position: boolean;
  amount: string;
  nft_id: string;
};

export type MarketResolvedEventData = {
  market_id: string;
  outcome: boolean;
  total_yield_earned: string;
};

export type WinningsClaimedEventData = {
  bet_id: string;
  user: string;
  winning_amount: string;
  yield_share: string;
  nft_id: string;
};

export type YieldDepositedEventData = {
  market_id: string;
  amount: string;
};

export type BetProofNFTMintedEventData = {
  market_id: string;
  bet_id: string;
  nft_id: string;
  owner: string;
  position: boolean;
  bet_amount: string;
  blob_address: string;
  image_url: string;
  image_blob_id: string;
};

export type WinningProofNFTMintedEventData = {
  market_id: string;
  bet_id: string;
  nft_id: string;
  owner: string;
  winning_amount: string;
  profit_percentage: string;
};

export type NautilusMarketResolvedEventData = {
  market_id: string;
  outcome: boolean;
  source_data: string;
  resolution_timestamp: string;
  enclave_id: string;
  blob_address: string;
  image_url: string;
  image_blob_id: string;
};

export const handleMarketCreated = async (
  event: SuiEvent,
  data: MarketCreatedEventData
) => {
  try {
    const { txDigest, eventSeq } = event.id;
    const result = await prisma.prophetMarketCreatedEvent.upsert({
      where: {
        prophetMarketCreated_txDigest_eventSeq: { txDigest, eventSeq },
      },
      update: {
        blockchainMarketId: data.market_id,
      },
      create: {
        marketId: data.market_id,
        blockchainMarketId: data.market_id,
        creator: data.creator,
        question: data.question,
        duration: BigInt(data.end_time),
        txDigest,
        eventSeq,
        sender: event.sender,
        timestampMs: BigInt(event.timestampMs),
        rawData: JSON.stringify(data),
      },
    });

    if (syncMarketFromEvent) {
      try {
        await syncMarketFromEvent(data.market_id, data, data.market_id);
      } catch (syncError) {
        console.warn('⚠️  Failed to sync market:', syncError);
      }
    }

    return result;
  } catch (e) {
    console.error('Error handling MarketCreated:', e, 'Data:', data);
    throw e;
  }
};

export const handleBetPlaced = async (
  event: SuiEvent,
  data: BetPlacedEventData
) => {
  try {
    const { txDigest, eventSeq } = event.id;
    const result = await prisma.prophetBetPlacedEvent.upsert({
      where: {
        prophetBetPlaced_txDigest_eventSeq: { txDigest, eventSeq },
      },
      update: {},
      create: {
        betId: data.bet_id,
        marketId: data.market_id,
        bettor: data.user,
        position: data.position,
        amount: BigInt(data.amount),
        nftId: data.nft_id,
        txDigest,
        eventSeq,
        sender: event.sender,
        timestampMs: BigInt(event.timestampMs),
        rawData: JSON.stringify(data),
      },
    });

    if (syncBetFromEvent) {
      try {
        await syncBetFromEvent(
          data.bet_id,
          data.market_id,
          data.user,
          data.position,
          BigInt(data.amount)
        );
      } catch (syncError) {
        console.warn('⚠️  Failed to sync bet:', syncError);
      }
    }

    return result;
  } catch (e) {
    console.error('Error handling BetPlaced:', e, 'Data:', data);
    throw e;
  }
};

export const handleMarketResolved = async (
  event: SuiEvent,
  data: MarketResolvedEventData
) => {
  const { txDigest, eventSeq } = event.id;
  const result = await prisma.prophetMarketResolvedEvent.upsert({
    where: {
      prophetMarketResolved_txDigest_eventSeq: { txDigest, eventSeq },
    },
    update: {},
    create: {
      marketId: data.market_id,
      outcome: data.outcome,
      totalYieldEarned: BigInt(data.total_yield_earned),
      txDigest,
      eventSeq,
      sender: event.sender,
      timestampMs: BigInt(event.timestampMs),
      rawData: JSON.stringify(data),
    },
  });

  if (resolveMarket) {
    try {
      await resolveMarket(data.market_id, data.outcome);

      await prisma.marketResolved.upsert({
        where: { marketId: data.market_id },
        update: {
          outcome: data.outcome,
          totalYieldEarned: BigInt(data.total_yield_earned),
        },
        create: {
          marketId: data.market_id,
          outcome: data.outcome,
          totalYieldEarned: BigInt(data.total_yield_earned),
        },
      });
    } catch (syncError) {
      console.warn('⚠️  Failed to sync market resolution:', syncError);
    }
  }

  return result;
};

export const handleNautilusMarketResolved = async (
  event: SuiEvent,
  data: NautilusMarketResolvedEventData
) => {
  const { txDigest, eventSeq } = event.id;

  console.log(
    `🔐 Nautilus Market Resolved: market_id=${data.market_id}, outcome=${data.outcome}, source=${data.source_data.substring(0, 50)}...`
  );

  // Update market in database
  try {
    await prisma.market.update({
      where: { marketId: data.market_id },
      data: {
        isResolved: true,
        outcome: data.outcome,
        status: 'resolved',
        resolutionDate: new Date(Number(data.resolution_timestamp) * 1000),
      },
    });
  } catch (error) {
    console.warn(
      `⚠️  Failed to update market ${data.market_id} from Nautilus event:`,
      error
    );
  }

  return {
    marketId: data.market_id,
    outcome: data.outcome,
    sourceData: data.source_data,
    resolutionTimestamp: data.resolution_timestamp,
    enclaveId: data.enclave_id,
    txDigest,
    eventSeq,
  };
};

export const handleWinningsClaimed = async (
  event: SuiEvent,
  data: WinningsClaimedEventData
) => {
  try {
    const { txDigest, eventSeq } = event.id;
    const result = await prisma.prophetWinningsClaimedEvent.upsert({
      where: {
        prophetWinningsClaimed_txDigest_eventSeq: { txDigest, eventSeq },
      },
      update: {},
      create: {
        betId: data.bet_id,
        user: data.user,
        winningAmount: BigInt(data.winning_amount),
        yieldShare: BigInt(data.yield_share),
        nftId: data.nft_id,
        txDigest,
        eventSeq,
        sender: event.sender,
        timestampMs: BigInt(event.timestampMs),
        rawData: JSON.stringify(data),
      },
    });

    if (markBetClaimed) {
      try {
        await markBetClaimed(
          data.bet_id,
          BigInt(data.winning_amount),
          BigInt(data.yield_share)
        );

        await prisma.winningsClaimed.upsert({
          where: { betId: data.bet_id },
          update: {
            winningAmount: BigInt(data.winning_amount),
            yieldShare: BigInt(data.yield_share),
          },
          create: {
            betId: data.bet_id,
            user: data.user,
            winningAmount: BigInt(data.winning_amount),
            yieldShare: BigInt(data.yield_share),
          },
        });
      } catch (syncError) {
        console.warn('⚠️  Failed to sync winnings claimed:', syncError);
      }
    }

    return result;
  } catch (e) {
    console.error('Error handling WinningsClaimed:', e, 'Data:', data);
    throw e;
  }
};

export const handleYieldDeposited = async (
  event: SuiEvent,
  data: YieldDepositedEventData
) => {
  try {
    const { txDigest, eventSeq } = event.id;
    const result = await prisma.prophetYieldDepositedEvent.upsert({
      where: {
        prophetYieldDeposited_txDigest_eventSeq: { txDigest, eventSeq },
      },
      update: {},
      create: {
        marketId: data.market_id,
        amount: BigInt(data.amount),
        txDigest,
        eventSeq,
        sender: event.sender,
        timestampMs: BigInt(event.timestampMs),
        rawData: JSON.stringify(data),
      },
    });

    try {
      const marketExists = await prisma.market.findUnique({
        where: { marketId: data.market_id },
      });

      if (marketExists) {
        await prisma.yieldDeposit.create({
          data: {
            marketId: data.market_id,
            amount: BigInt(data.amount),
          },
        });
      } else {
        console.warn(
          `⚠️  Market ${data.market_id} does not exist yet, skipping yield deposit`
        );
      }
    } catch (syncError) {
      if (!syncError.message?.includes('Unique constraint')) {
        console.warn('⚠️  Failed to create yield deposit:', syncError);
      }
    }

    return result;
  } catch (e) {
    console.error('Error handling YieldDeposited:', e, 'Data:', data);
    throw e;
  }
};

export const handleBetProofNFTMinted = async (
  event: SuiEvent,
  data: BetProofNFTMintedEventData
) => {
  try {
    const { txDigest, eventSeq } = event.id;
    const result = await prisma.betProofNFTMintedEvent.upsert({
      where: {
        betProofNFTMinted_txDigest_eventSeq: { txDigest, eventSeq },
      },
      update: {},
      create: {
        marketId: data.market_id,
        betId: data.bet_id,
        nftId: data.nft_id,
        owner: data.owner,
        position: data.position,
        betAmount: BigInt(data.bet_amount),
        blobAddress: data.blob_address,
        imageUrl: data.image_url,
        imageBlobId: data.image_blob_id,
        txDigest,
        eventSeq,
        sender: event.sender,
        timestampMs: BigInt(event.timestampMs),
        rawData: JSON.stringify(data),
      },
    });

    return result;
  } catch (e) {
    console.error('Error handling BetProofNFTMinted:', e, 'Data:', data);
    throw e;
  }
};

export const handleWinningProofNFTMinted = async (
  event: SuiEvent,
  data: WinningProofNFTMintedEventData
) => {
  try {
    const { txDigest, eventSeq } = event.id;
    const result = await prisma.winningProofNFTMintedEvent.upsert({
      where: {
        winningProofNFTMinted_txDigest_eventSeq: { txDigest, eventSeq },
      },
      update: {},
      create: {
        marketId: data.market_id,
        betId: data.bet_id,
        nftId: data.nft_id,
        owner: data.owner,
        winningAmount: BigInt(data.winning_amount),
        profitPercentage: BigInt(data.profit_percentage),
        blobAddress: data.blob_address,
        imageUrl: data.image_url,
        imageBlobId: data.image_blob_id,
        txDigest,
        eventSeq,
        sender: event.sender,
        timestampMs: BigInt(event.timestampMs),
        rawData: JSON.stringify(data),
      },
    });

    return result;
  } catch (e) {
    console.error('Error handling WinningProofNFTMinted:', e, 'Data:', data);
    throw e;
  }
};
