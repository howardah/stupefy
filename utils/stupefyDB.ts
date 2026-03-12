import type { Collection, MongoClient } from "mongodb";
import type { GameRoomSyncResponse, GameState } from "./types";
import { initialise } from "./card-setup";
import { createMongoClient } from "./mongo-client";
import { parseGameState } from "./parsers";
import { applyGameRoomLifecycle, isGameRoomActive } from "./room-lifecycle";
import { normalizeRoomKey } from "./room";

const ROOM_DOCUMENT_FILTER = { _id: 0 };

async function withClient<T>(runner: (client: MongoClient) => Promise<T>): Promise<T> {
  const client = createMongoClient();

  try {
    await client.connect();
    return await runner(client);
  } finally {
    await client.close();
  }
}

async function getCollection(
  client: MongoClient,
  room: string
): Promise<Collection<GameState>> {
  const db = client.db("stupefy");
  return db.collection<GameState>(normalizeRoomKey(room));
}

async function getRoom(room: string): Promise<GameState[] | false> {
  return withClient(async (client) => {
    const collection = await getCollection(client, room);
    const parsed = parseGameState(await collection.findOne(ROOM_DOCUMENT_FILTER));
    const roomState = parsed ? applyGameRoomLifecycle(parsed) : null;

    if (!roomState || !roomState.players.length || !isGameRoomActive(roomState)) {
      return false;
    }

    if (roomState.status !== parsed?.status || roomState.expiresAt !== parsed?.expiresAt) {
      await collection.replaceOne(ROOM_DOCUMENT_FILTER, roomState, { upsert: true });
    }

    return [roomState];
  });
}

async function updateRoom(
  room: string,
  data: Partial<GameState>,
  expectedLastUpdated?: number
): Promise<GameRoomSyncResponse> {
  return withClient(async (client) => {
    const collection = await getCollection(client, room);
    const currentDocument = parseGameState(await collection.findOne(ROOM_DOCUMENT_FILTER));
    const current =
      (currentDocument ? applyGameRoomLifecycle(currentDocument) : null) ??
      applyGameRoomLifecycle(initialise([]));

    if (
      typeof expectedLastUpdated === "number" &&
      typeof current.last_updated === "number" &&
      current.last_updated !== expectedLastUpdated
    ) {
      return {
        conflict: true,
        ok: false,
        room: current,
        transport: "polling",
        updated: false,
      };
    }

    const nextState: GameState = {
      ...current,
      ...data,
      _id: 0,
      createdAt: current.createdAt ?? Date.now(),
      expiresAt: undefined,
      last_updated: Date.now(),
      status: "active",
    };
    const normalizedState = applyGameRoomLifecycle(nextState);

    await collection.replaceOne(
      ROOM_DOCUMENT_FILTER,
      parseGameState(normalizedState) ?? normalizedState,
      { upsert: true }
    );

    return {
      conflict: false,
      ok: true,
      room: parseGameState(normalizedState),
      transport: "polling",
      updated: true,
    };
  });
}

async function makeRoom(room: string): Promise<GameState[]> {
  return withClient(async (client) => {
    const collection = await getCollection(client, room);
    const parsed = parseGameState(await collection.findOne(ROOM_DOCUMENT_FILTER));
    const current = parsed ? applyGameRoomLifecycle(parsed) : null;

    if (current && current.players.length && current.deck && isGameRoomActive(current)) {
      return [current];
    }

    const nextState = applyGameRoomLifecycle({
      ...initialise([] as never[]),
      _id: 0,
      createdAt: Date.now(),
      last_updated: Date.now(),
      status: "active",
    });

    await collection.replaceOne(
      ROOM_DOCUMENT_FILTER,
      nextState,
      { upsert: true }
    );

    return [nextState];
  });
}

export { getRoom, makeRoom, updateRoom };
