import type { Collection, MongoClient } from "mongodb";
import type { GameState, PlayerState } from "./types";

const { initialise } = require("./card-setup") as {
  initialise(players: PlayerState[]): GameState;
};
const { createMongoClient } = require("./mongo-client") as {
  createMongoClient(): MongoClient;
};

interface NewRoomRequest {
  players: PlayerState[];
  room: string;
}

async function newRoom(data: NewRoomRequest): Promise<GameState[] | undefined> {
  try {
    const dataObj = await roomRequest(data);
    console.log("call ended");
    return dataObj;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

async function roomRequest(
  details: NewRoomRequest
): Promise<GameState[] | undefined> {
  let data: GameState[] | undefined;
  const client = createMongoClient();

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Make the appropriate DB calls
    data = await createRoom(client, details);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }

  return data;
}

async function createRoom(
  client: MongoClient,
  info: NewRoomRequest
): Promise<GameState[]> {
  const db = await client.db("stupefy");

  const names = await db.listCollections().toArray();
  const exists = names.some((coll) => {
    return coll.name === info.room;
  });

  const obj = initialise(info.players);
  obj._id = 0;

  if (exists) {
    await db.collection<GameState>(info.room).deleteMany({});
  }

  await (db.collection(info.room) as Collection<GameState>).insertOne(
    Object.assign(obj, { last_updated: Date.now() })
  );

  return [obj];
}

module.exports = { newRoom };
