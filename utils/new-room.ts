import type { Collection, MongoClient } from "mongodb";
import type { GameState, PlayerState } from "./types";
import { initialise } from "./card-setup";
import { createMongoClient } from "./mongo-client";
import { parseGameState } from "./parsers";
import { applyGameRoomLifecycle, isGameRoomActive } from "./room-lifecycle";
import { normalizeRoomKey } from "./room";

interface NewRoomRequest {
  players: PlayerState[];
  room: string;
  sourceWaitingRoom?: string;
}

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

function samePlayers(left: PlayerState[], right: PlayerState[]): boolean {
  const leftIds = left.map((player) => player.id).sort((a, b) => a - b);
  const rightIds = right.map((player) => player.id).sort((a, b) => a - b);

  return (
    leftIds.length === rightIds.length &&
    leftIds.every((value, index) => value === rightIds[index])
  );
}

async function newRoom(data: NewRoomRequest): Promise<GameState[] | undefined> {
  try {
    return await withClient(async (client) => {
      const collection = client
        .db("stupefy")
        .collection<GameState>(normalizeRoomKey(data.room)) as Collection<GameState>;

      const parsed = parseGameState(await collection.findOne(ROOM_DOCUMENT_FILTER));
      const current = parsed ? applyGameRoomLifecycle(parsed) : null;

      if (current && isGameRoomActive(current) && samePlayers(current.players, data.players)) {
        return [current];
      }

      const now = Date.now();
      const nextState = applyGameRoomLifecycle({
        ...initialise(data.players),
        _id: 0,
        createdAt: current?.createdAt ?? now,
        last_updated: now,
        sourceWaitingRoom: data.sourceWaitingRoom ?? data.room,
        startedAt: current?.startedAt ?? now,
        status: "active",
      });

      await collection.replaceOne(
        ROOM_DOCUMENT_FILTER,
        nextState,
        { upsert: true }
      );

      return [nextState];
    });
  } catch (error) {
    console.error("[new-room] Failed to create or load game room.", {
      error,
      room: data.room,
      sourceWaitingRoom: data.sourceWaitingRoom ?? data.room,
    });
    return undefined;
  }
}

export { newRoom };
