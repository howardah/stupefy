import type { Collection, MongoClient } from "mongodb";
import type { GameState, PlayerState } from "./types";

const { initialise } = require("./card-setup") as {
  initialise(players: PlayerState[]): GameState;
};
const { createMongoClient } = require("./mongo-client") as {
  createMongoClient(): MongoClient;
};
const { parseGameState } = require("./parsers") as typeof import("./parsers");
const { normalizeRoomKey } = require("./room") as typeof import("./room");

interface NewRoomRequest {
  players: PlayerState[];
  room: string;
}

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

      const current = parseGameState(await collection.findOne());
      if (current && samePlayers(current.players, data.players)) {
        return [current];
      }

      const nextState = initialise(data.players);
      nextState._id = 0;

      await collection.replaceOne(
        {},
        Object.assign(nextState, { last_updated: Date.now() }),
        { upsert: true }
      );

      return [nextState];
    });
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

module.exports = { newRoom };
