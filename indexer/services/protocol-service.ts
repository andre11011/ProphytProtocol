import { PrismaClient } from '@prisma/client';
import dotend from 'dotenv';

dotend.config();
const prisma = new PrismaClient();

export type ProtocolName = 'suilend' | 'haedal' | 'volo';

export interface ProtocolConfig {
  name: ProtocolName;
  displayName: string;
  stateId: string;
  description?: string;
  iconUrl?: string;
  apy?: string;
}

/**
 * Initialize protocols from environment variables
 */
export const initializeProtocols = async (): Promise<void> => {
  const suilendStateId = process.env.PROPHYT_SUILEND_STATE_ID;
  const haedalStateId = process.env.PROPHYT_HAEDAL_STATE_ID;
  const voloStateId = process.env.PROPHYT_VOLO_STATE_ID;

  if (!suilendStateId || !haedalStateId || !voloStateId) {
    throw new Error(
      'Missing protocol state IDs in environment variables. Please set PROPHYT_SUILEND_STATE_ID, PROPHYT_HAEDAL_STATE_ID, and PROPHYT_VOLO_STATE_ID.'
    );
  }

  const protocols: ProtocolConfig[] = [
    {
      name: 'suilend',
      displayName: 'Suilend',
      stateId: suilendStateId,
      apy: '5',
      iconUrl:
        'https://res.cloudinary.com/dutlw7bko/image/upload/v1763005047/sui/suilend_hieikz.png',
      description: 'Suilend lending protocol for yield generation',
    },
    {
      name: 'haedal',
      displayName: 'Haedal',
      stateId: haedalStateId,
      apy: '7.5',
      iconUrl:
        'https://res.cloudinary.com/dutlw7bko/image/upload/v1763005047/sui/haedal_u4alvm.png',
      description: 'Haedal staking protocol for yield generation',
    },
    {
      name: 'volo',
      displayName: 'Volo',
      stateId: voloStateId,
      apy: '6.5',
      iconUrl:
        'https://res.cloudinary.com/dutlw7bko/image/upload/v1763005047/sui/volo_zhbngt.png',
      description: 'Volo DeFi protocol for yield generation',
    },
  ];

  for (const protocol of protocols) {
    if (!protocol.stateId) {
      console.warn(`⚠️ Missing state ID for protocol: ${protocol.name}`);
      continue;
    }

    await prisma.protocol.upsert({
      where: { name: protocol.name },
      update: {
        stateId: protocol.stateId,
        displayName: protocol.displayName,
        description: protocol.description,
        apy: protocol.apy,
        iconUrl: protocol.iconUrl,
        isActive: true,
      },
      create: {
        name: protocol.name,
        stateId: protocol.stateId,
        displayName: protocol.displayName,
        description: protocol.description,
        apy: protocol.apy,
        iconUrl: protocol.iconUrl,
        isActive: true,
      },
    });

    console.log(`✅ Initialized protocol: ${protocol.displayName}`);
  }
};

/**
 * Get a protocol by name
 */
export const getProtocolByName = async (name: ProtocolName) => {
  return await prisma.protocol.findUnique({
    where: { name },
  });
};

/**
 * Get all active protocols
 */
export const getActiveProtocols = async () => {
  return await prisma.protocol.findMany({
    where: { isActive: true },
  });
};

/**
 * Get protocol by state ID
 */
export const getProtocolByStateId = async (stateId: string) => {
  return await prisma.protocol.findFirst({
    where: { stateId },
  });
};

/**
 * Select a random active protocol
 */
export const getRandomProtocol = async () => {
  const protocols = await getActiveProtocols();
  if (protocols.length === 0) {
    throw new Error('No active protocols available');
  }
  const randomIndex = Math.floor(Math.random() * protocols.length);
  return protocols[randomIndex];
};

/**
 * Get protocol statistics for a specific market
 */
export const getProtocolStats = async (protocolId: string) => {
  const markets = await prisma.market.findMany({
    where: { protocolId },
    include: {
      yieldDeposits: true,
      bets: true,
      marketResolvedEvent: true,
    },
  });

  const totalMarkets = markets.length;
  const activeMarkets = markets.filter((m) => m.status === 'active').length;
  const resolvedMarkets = markets.filter((m) => m.isResolved).length;

  const totalVolume = markets.reduce((sum, m) => sum + Number(m.volume), 0);
  const totalYield = markets.reduce(
    (sum, m) => sum + Number(m.totalYieldEarned),
    0
  );
  const totalBets = markets.reduce((sum, m) => sum + m.bets.length, 0);

  return {
    totalMarkets,
    activeMarkets,
    resolvedMarkets,
    totalVolume,
    totalYield,
    totalBets,
  };
};

/**
 * Deactivate a protocol
 */
export const deactivateProtocol = async (name: ProtocolName) => {
  return await prisma.protocol.update({
    where: { name },
    data: { isActive: false },
  });
};

/**
 * Activate a protocol
 */
export const activateProtocol = async (name: ProtocolName) => {
  return await prisma.protocol.update({
    where: { name },
    data: { isActive: true },
  });
};
