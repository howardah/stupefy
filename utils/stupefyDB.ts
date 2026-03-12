import type { Collection, MongoClient, UpdateResult, WithId } from "mongodb";
import type { GameState } from "./types";

const { initialise } = require("./card-setup") as {
  initialise(players: never[]): GameState;
};
const { camelCase } = require("lodash") as typeof import("lodash");
const { createMongoClient } = require("./mongo-client") as {
  createMongoClient(): MongoClient;
};

// const { initialise } = require("../utils/card-setup");
//Prevent problems by postponing db requests until
//the current requests are dealt with
interface QueueState {
  busy: boolean;
  data: Partial<GameState>;
}

type RoomRequestType = "get" | "make" | "update";

const queue: Record<string, QueueState> = {};

function isEmpty(obj: Record<string, unknown>): boolean {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
  }
  return true;
}

async function getRoom(room: string): Promise<GameState[] | false | undefined> {
  if (queue[room] === undefined) queue[room] = { busy: false, data: {} };
  const roomQueue = queue[room]!;
  return new Promise(function (resolve) {
    const currentRoom = room;
    // console.log(queue[currentRoom].busy);
    async function askForRoom(thisRoom: string): Promise<void> {
      if (!roomQueue.busy) {
        console.log("call begins");
        console.log(thisRoom);
        roomQueue.busy = true;
        const dataObj = (await roomRequest("get", {
          room: thisRoom,
        })) as GameState[] | false | undefined;
        console.log("call ended");

        roomQueue.busy = false;
        resolve(dataObj);
      } else {
        setTimeout(() => {
          void askForRoom(thisRoom);
        }, 1000);
      }
    }
    void askForRoom(currentRoom);
  });
}
async function updateRoom(
  room: string,
  data: Partial<GameState>
): Promise<UpdateResult<GameState> | void | undefined> {
  if (queue[room] === undefined) queue[room] = { busy: false, data: {} };
  const currentRoom = room;
  const currentData = data;
  const roomQueue = queue[currentRoom]!;
  if (!roomQueue.busy) {
    console.log("call begins");
    roomQueue.busy = true;
    const dataObj = await roomRequest("update", {
      room: currentRoom,
      data: currentData,
    });
    console.log("call ended");
    roomQueue.busy = false;
    if (!isEmpty(roomQueue.data)) {
      const oldData = roomQueue.data;
      roomQueue.data = {};
      void updateRoom(currentRoom, oldData);
    }
    return dataObj && "matchedCount" in dataObj ? dataObj : undefined;
  } else {
    const currentQueue = roomQueue.data;
    roomQueue.data = Object.assign(currentQueue, currentData);
    console.log(queue);
  }
}

async function makeRoom(room: string): Promise<GameState[] | undefined> {
  return new Promise(function (resolve) {
    const currentRoom = room;
    async function askForRoom(thisRoom: string): Promise<void> {
      console.log("call begins");
      console.log(thisRoom);
      const dataObj = (await roomRequest("make", {
        room: thisRoom,
      })) as GameState[] | undefined;
      console.log("call ended");
      queue[currentRoom] = { busy: false, data: {} };
      resolve(Array.isArray(dataObj) ? dataObj : undefined);
    }
    void askForRoom(currentRoom);
  });
}

async function roomRequest(
  request: RoomRequestType,
  details: { data?: Partial<GameState>; room: string }
): Promise<GameState[] | false | UpdateResult<GameState> | undefined> {
  let data: GameState[] | false | UpdateResult<GameState> | undefined;
  const client = createMongoClient();

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Make the appropriate DB calls
    switch (request) {
      case "update":
        data = await setRoom(client, {
          room: details.room,
          data: details.data ?? {},
        });
        break;
      case "get":
        data = await fetchRoom(client, details);
        break;
      case "make":
        data = await createRoom(client, details);
        break;
      default:
        console.log("No valid request specified");
        break;
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }

  return data;
}

async function fetchRoom(
  client: MongoClient,
  info: { room: string }
): Promise<GameState[] | false> {
  const db = await client.db("stupefy");
  const result = (await (
    db.collection(camelCase(info.room)) as Collection<GameState>
  )
    .find()
    .toArray()) as WithId<GameState>[];
  let returnData: GameState[] | false = result as GameState[];
  if (
    result[0] === undefined ||
    result[0].players === undefined ||
    result[0].players.length === 0
  )
    returnData = false;

  console.log(returnData);
  return returnData;
}

async function createRoom(
  client: MongoClient,
  info: { room: string }
): Promise<GameState[]> {
  const db = await client.db("stupefy");

  const names = await db.listCollections().toArray();
  const exists = names.some((coll) => {
    return coll.name === camelCase(info.room);
  });

  let returnData: GameState[];

  if (exists) {
    returnData = (await (
      db.collection(camelCase(info.room)) as Collection<GameState>
    )
      .find()
      .toArray()) as WithId<GameState>[] as GameState[];
    if (
      returnData[0]?.players === undefined ||
      returnData[0]?.players.length === 0 ||
      returnData[0]?.deck === undefined
    ) {
      const obj = initialise([] as never[]);
      returnData = [obj];
      await setRoom(client, { room: info.room, data: returnData[0]! });
    }
  } else {
    const obj = initialise([] as never[]);
    obj._id = 0;
    returnData = [obj];
    await (db.collection(camelCase(info.room)) as Collection<GameState>).insertOne(
      Object.assign(obj, { last_updated: Date.now() })
    );
  }

  return returnData;
}

async function setRoom(
  client: MongoClient,
  info: { data: Partial<GameState>; room: string }
): Promise<UpdateResult<GameState>> {
  const db = await client.db("stupefy"),
    collection = (await db.collection(
      camelCase(info.room)
    )) as Collection<GameState>;

  const current_object = (await collection.findOne()) ?? ({} as GameState);

  // console.log(current_object);
  // console.log(info);
  //   let state = Object.assign(current_object, info.data);
  const new_object = Object.assign(current_object, info.data, {
    last_updated: Date.now(),
  });

  //   new_object.state = state;

  console.log("Set Room");
  const finObj = await collection.updateOne(
    {},
    { $set: new_object },
    { upsert: true }
  );

  return finObj;
}

module.exports = { getRoom, updateRoom, makeRoom };
