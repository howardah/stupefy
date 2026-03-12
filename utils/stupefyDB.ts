import type { Collection, MongoClient, UpdateResult } from "mongodb";
import type { GameState } from "./types";

const { initialise } = require("./card-setup") as {
  initialise(players: never[]): GameState;
};
const { createMongoClient } = require("./mongo-client") as {
  createMongoClient(): MongoClient;
};
const { parseGameState } = require("./parsers") as typeof import("./parsers");
const { normalizeRoomKey } = require("./room") as typeof import("./room");

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
  data: Partial<GameState>
): Promise<UpdateResult<GameState>> {
  return withClient(async (client) => {
    const collection = await getCollection(client, room);
    const current = parseGameState(await collection.findOne()) ?? initialise([] as never[]);
    const nextState: GameState = {
      ...current,
      ...data,
      last_updated: Date.now(),
    };

    return collection.updateOne({}, { $set: nextState }, { upsert: true });
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

module.exports = { getRoom, updateRoom, makeRoom };
