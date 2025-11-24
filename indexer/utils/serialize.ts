/* eslint-disable @typescript-eslint/no-explicit-any */
export const serializeBigInt = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }

  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }

  return obj;
};

export const serializeMarket = (market: any) => {
  return {
    ...market,
    volume: market.volume?.toString() || '0',
    openInterest: market.openInterest?.toString() || '0',
    totalYesBets: market.totalYesBets?.toString() || '0',
    totalNoBets: market.totalNoBets?.toString() || '0',
    totalYesCount: market.totalYesCount || 0,
    totalNoCount: market.totalNoCount || 0,
    totalPoolSize: market.totalPoolSize?.toString() || '0',
    totalYieldEarned: market.totalYieldEarned?.toString() || '0',
    bets: market.bets?.map((bet: any) => ({
      ...bet,
      amount: bet.amount?.toString() || '0',
      winningAmount: bet.winningAmount?.toString() || null,
      yieldShare: bet.yieldShare?.toString() || null,
    })),
    yieldDeposits: market.yieldDeposits?.map((deposit: any) => ({
      ...deposit,
      amount: deposit.amount?.toString() || '0',
    })),
    marketResolvedEvent: market.marketResolvedEvent
      ? {
          ...market.marketResolvedEvent,
          totalYieldEarned:
            market.marketResolvedEvent.totalYieldEarned?.toString() || '0',
        }
      : null,
  };
};

export const serializeBet = (bet: any) => {
  return {
    ...bet,
    amount: bet.amount?.toString() || '0',
    winningAmount: bet.winningAmount?.toString() || null,
    yieldShare: bet.yieldShare?.toString() || null,
  };
};
