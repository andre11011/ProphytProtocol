import {
  EventId,
  SuiClient,
  SuiEvent,
  SuiEventFilter,
} from '@mysten/sui/client';
import pLimit from 'p-limit';
import { CONFIG } from '../config';
import { prisma } from '../db';
import { getClient } from '../sui-utils';
import { prophytEventSubscriptions } from '../helpers/event-filter-prophyt';

type SuiEventsCursor = EventId | null | undefined;

type EventExecutionResult = {
  cursor: SuiEventsCursor;
  hasNextPage: boolean;
};

type EventTracker = {
  type: string;
  filter: SuiEventFilter;
  callback: (events: SuiEvent[], type: string) => Promise<void>;
};

const EVENTS_TO_TRACK: EventTracker[] = [...prophytEventSubscriptions];

const saveLatestCursor = async (tracker: EventTracker, cursor: EventId) => {
  const data = {
    eventSeq: cursor.eventSeq,
    txDigest: cursor.txDigest,
  };

  return prisma.cursor.upsert({
    where: { id: tracker.type },
    update: data,
    create: { id: tracker.type, ...data },
  });
};

const getLatestCursor = async (
  tracker: EventTracker
): Promise<SuiEventsCursor> => {
  try {
    const cursor = await prisma.cursor.findUnique({
      where: { id: tracker.type },
    });
    return cursor
      ? { txDigest: cursor.txDigest, eventSeq: cursor.eventSeq }
      : undefined;
  } catch (e) {
    console.error(`Error fetching cursor for ${tracker.type}:`, e);
    return undefined;
  }
};

const executeEventJob = async (
  client: SuiClient,
  tracker: EventTracker,
  cursor: SuiEventsCursor
): Promise<EventExecutionResult> => {
  try {
    console.log(`[${tracker.type}] Querying events with cursor:`, cursor);
    const { data, hasNextPage, nextCursor } = await client.queryEvents({
      query: tracker.filter,
      cursor,
      order: 'ascending',
    });

    console.log(
      `[${tracker.type}] Found ${data.length} events, hasNextPage: ${hasNextPage}`
    );

    if (data.length > 0) {
      console.log(
        `[${tracker.type}] Calling handler with ${data.length} events`
      );
      await tracker.callback(data, tracker.type);
    }

    if (nextCursor) {
      console.log(`[${tracker.type}] Saving cursor`);
      await saveLatestCursor(tracker, nextCursor);
      return { cursor: nextCursor, hasNextPage };
    }
  } catch (e: unknown) {
    const msg =
      typeof e === 'object' &&
      e !== null &&
      'message' in e &&
      typeof (e as { message?: unknown }).message === 'string'
        ? (e as { message: string }).message
        : String(e);
    console.error(`[${tracker.type}] Error:`, msg);

    if (
      typeof msg === 'string' &&
      msg.includes('Could not find the referenced transaction')
    ) {
      console.log(`[${tracker.type}] Invalid cursor, resetting...`);
      await prisma.cursor
        .delete({ where: { id: tracker.type } })
        .catch(() => {});
      return { cursor: undefined, hasNextPage: false };
    }
  }

  return { cursor, hasNextPage: false };
};

const runEventJob = async (client: SuiClient, tracker: EventTracker) => {
  let cursor = await getLatestCursor(tracker);

  while (true) {
    const result = await executeEventJob(client, tracker, cursor);

    cursor = result.cursor;
    if (!result.hasNextPage) {
      await new Promise((r) => setTimeout(r, CONFIG.POLLING_INTERVAL_MS));
    }
  }
};

export const setupListeners = async () => {
  console.log(`Starting indexer with ${EVENTS_TO_TRACK.length} event trackers`);
  const limit = pLimit(CONFIG.CONCURRENCY_LIMIT);
  const client = getClient(CONFIG.NETWORK);

  await Promise.all(
    EVENTS_TO_TRACK.map((tracker) => {
      console.log(`Starting tracker for ${tracker.type}`);
      return limit(async () => {
        try {
          await runEventJob(client, tracker);
        } catch (e) {
          console.error(`Tracker ${tracker.type} failed:`, e);
        }
      });
    })
  );
};
