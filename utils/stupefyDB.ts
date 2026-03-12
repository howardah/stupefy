import type { Collection, MongoClient } from "mongodb";
import type { GameRoomSyncResponse, GameState } from "./types";
import { initialise } from "./card-setup";
import { createMongoClient } from "./mongo-client";
import { parseGameState } from "./parsers";
import { normalizeRoomKey } from "./room";

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
    const raw = await collection.find().limit(1).toArray();
    const parsed = parseGameState(raw[0]);

    if (!parsed || !parsed.players.length) return false;
    return [parsed];
  });
}

async function updateRoom(
  room: string,
  data: Partial<GameState>,
  expectedLastUpdated?: number
): Promise<GameRoomSyncResponse> {
  return withClient(async (client) => {
    const collection = await getCollection(client, room);
    const current = parseGameState(await collection.findOne()) ?? initialise([]);

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
      last_updated: Date.now(),
    };

    await collection.updateOne({}, { $set: parseGameState(nextState) ?? nextState }, { upsert: true });

    return {
      conflict: false,
      ok: true,
      room: parseGameState(nextState),
      transport: "polling",
      updated: true,
    };
  });
}

async function makeRoom(room: string): Promise<GameState[]> {
  return withClient(async (client) => {
    const collection = await getCollection(client, room);
    const current = parseGameState(await collection.findOne());

    if (current && current.players.length && current.deck) {
      return [current];
    }

    const nextState = initialise([] as never[]);
    nextState._id = 0;

    await collection.replaceOne(
      {},
      Object.assign(nextState, { last_updated: Date.now() }),
      { upsert: true }
    );

    return [nextState];
  });
}

export { getRoom, makeRoom, updateRoom };
