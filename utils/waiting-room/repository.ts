import type { Collection, MongoClient } from "mongodb";
import type { GameState, WaitingRoomState } from "../types";
import { createMongoClient } from "../mongo-client";
import { parseGameState, parseWaitingRoomState } from "../parsers";
import { normalizeRoomKey } from "../room";
import { normalizeGameRoom, prunePresence } from "./lifecycle";

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

async function getWaitingCollection(
  client: MongoClient,
  room: string,
): Promise<Collection<WaitingRoomState>> {
  return client.db("waiting_room").collection<WaitingRoomState>(normalizeRoomKey(room));
}

async function getGameCollection(
  client: MongoClient,
  room: string,
): Promise<Collection<GameState>> {
  return client.db("stupefy").collection<GameState>(normalizeRoomKey(room));
}

async function listWaitingCollectionNames(client: MongoClient): Promise<string[]> {
  const collections = await client.db("waiting_room").listCollections().toArray();
  return collections
    .map((collection) => collection.name)
    .filter((name): name is string => typeof name === "string" && name.length > 0);
}

async function readWaitingRoom(
  client: MongoClient,
  room: string,
): Promise<WaitingRoomState | null> {
  const collection = await getWaitingCollection(client, room);
  const parsed = parseWaitingRoomState(await collection.findOne(ROOM_DOCUMENT_FILTER));
  return parsed ? prunePresence(parsed) : null;
}

async function writeWaitingRoom(
  client: MongoClient,
  room: string,
  nextState: WaitingRoomState,
): Promise<WaitingRoomState> {
  const collection = await getWaitingCollection(client, room);
  const pruned = prunePresence(nextState);

  await collection.replaceOne(ROOM_DOCUMENT_FILTER, { ...pruned, _id: 0 }, { upsert: true });
  return pruned;
}

async function readGameRoom(
  client: MongoClient,
  room: string,
): Promise<GameState | null> {
  const collection = await getGameCollection(client, room);
  const parsed = parseGameState(await collection.findOne(ROOM_DOCUMENT_FILTER));
  return normalizeGameRoom(parsed);
}

export {
  getGameCollection,
  getWaitingCollection,
  listWaitingCollectionNames,
  readGameRoom,
  readWaitingRoom,
  withClient,
  writeWaitingRoom,
};
