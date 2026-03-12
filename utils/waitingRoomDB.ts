import type { Collection, MongoClient } from "mongodb";
import type {
  ErrorResult,
  GameState,
  WaitingChatMessage,
  WaitingPlayer,
  WaitingRoomCreateQuery,
  WaitingRoomGetQuery,
  WaitingRoomJoinQuery,
  WaitingRoomState,
} from "./types";

const camelCase = require("lodash/camelCase") as (value: string) => string;
const { idGenerator, decode } = require("./db-tools") as {
  decode(message: string, key: string): string;
  idGenerator(currentArr: WaitingPlayer[]): number;
};
const { createMongoClient } = require("./mongo-client") as {
  createMongoClient(): MongoClient;
};

// const { initialise } = require("../utils/card-setup");
//Prevent problems by postponing db requests until
//the current requests are dealt with
const queue: Record<string, { busy: boolean; data: Record<string, unknown> }> = {};

type WaitingRoomResult = Array<ErrorResult | WaitingRoomState>;

async function getWaitRoom(data: WaitingRoomGetQuery): Promise<WaitingRoomResult | undefined> {
  return new Promise(function (resolve) {
    const currentRoom = data.room;

    async function askForRoom(thisRoom: string): Promise<void> {
      console.log("call begins");
      console.log(thisRoom);
      const dataObj = await roomRequest("get", data);
      console.log("call ended");
      resolve(dataObj || undefined);
    }
    void askForRoom(currentRoom);
  });
}

async function joinWaitRoom(
  data: WaitingRoomJoinQuery
): Promise<WaitingRoomResult | undefined> {
  return new Promise(function (resolve) {
    const currentRoom = data.room;

    async function askForRoom(thisRoom: string): Promise<void> {
      console.log("call begins");
      console.log(thisRoom);
      const dataObj = await roomRequest("join", data);
      console.log("call ended");
      resolve(dataObj || undefined);
    }
    void askForRoom(currentRoom);
  });
}

async function updateActive(data: {
  data: Partial<WaitingRoomState>;
  room: string;
}): Promise<WaitingRoomResult | undefined> {
  return new Promise(function (resolve) {
    const currentRoom = data.room;

    async function askForRoom(thisRoom: string): Promise<void> {
      console.log("call begins");
      console.log(thisRoom);
      const dataObj = await roomRequest("active", data);
      console.log("call ended");
      resolve(dataObj || undefined);
    }
    void askForRoom(currentRoom);
  });
}

async function removeActiveSession(data: {
  room: string;
  sessionId: string;
}): Promise<WaitingRoomResult | undefined> {
  return new Promise(function (resolve) {
    const currentRoom = data.room;

    async function askForRoom(thisRoom: string): Promise<void> {
      console.log("call begins");
      console.log(thisRoom);
      const dataObj = await roomRequest("remove-active", data);
      console.log("call ended");
      resolve(dataObj || undefined);
    }
    void askForRoom(currentRoom);
  });
}

async function addChat(data: {
  newChat: WaitingChatMessage;
  room: string;
}): Promise<WaitingChatMessage[] | undefined> {
  console.log("call begins");
  const dataObj = await roomRequest("chat", data);
  console.log("call ended");
  const room = Array.isArray(dataObj) ? dataObj[0] : undefined;
  return room && "chat" in room ? room.chat : undefined;
}

async function makeWaitRoom(
  info: WaitingRoomCreateQuery
): Promise<WaitingRoomResult | false | undefined> {
  const roomKey = camelCase(info.room),
    players: WaitingPlayer[] = [{ name: info.player, id: idGenerator([]) }],
    password = info.pw || false;

  const newRoom: WaitingRoomState = {
    players,
    password,
    roomName: info.room,
    chat: [
      {
        text:
          "Once everyone has joined the room, you can click “Start Game” to set up the actual game.",
        player: 100,
        time: Date.now(),
      },
    ],
  };

  return new Promise(function (resolve) {
    const currentRoom = roomKey;
    async function askForRoom(thisRoom: string): Promise<void> {
      console.log("call begins");
      console.log(thisRoom);
      const dataObj = await roomRequest("make", { roomKey, room: newRoom });
      console.log("call ended");
      queue[currentRoom] = { busy: false, data: {} };
      resolve(dataObj || undefined);
    }
    void askForRoom(currentRoom);
  });
}

async function roomRequest(
  request:
    | "active"
    | "chat"
    | "get"
    | "join"
    | "make"
    | "remove-active"
    | "update",
  details:
    | WaitingRoomCreateQuery
    | WaitingRoomGetQuery
    | WaitingRoomJoinQuery
    | { data: Partial<WaitingRoomState>; room: string }
    | { newChat: WaitingChatMessage; room: string }
    | { room: string; sessionId: string }
    | { room: WaitingRoomState; roomKey: string }
): Promise<WaitingRoomResult | false | undefined> {
  let data: WaitingRoomResult | false | undefined;
  const client = createMongoClient();

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Make the appropriate DB calls
    switch (request) {
      case "update":
        data = await setWaitingRoom(client, details as {
          data: Partial<WaitingRoomState>;
          room: string;
        });
        break;
      case "join":
        data = await joinRoom(client, details as WaitingRoomJoinQuery);
        break;
      case "get":
        data = await fetchWaitRoom(client, details as WaitingRoomGetQuery);
        break;
      case "active":
        data = await setWaitingRoom(client, details as {
          data: Partial<WaitingRoomState>;
          room: string;
        });
        break;
      case "chat":
        data = await addChatToRoom(client, details as {
          newChat: WaitingChatMessage;
          room: string;
        });
        break;
      case "remove-active":
        data = await clearWaitingRoomSession(client, details as {
          room: string;
          sessionId: string;
        });
        break;
      case "make":
        data = await createWaitingRoom(client, details as {
          room: WaitingRoomState;
          roomKey: string;
        });
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
  const result = await (db.collection(info.room) as Collection<GameState>)
    .find()
    .toArray();
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

async function fetchWaitRoom(
  client: MongoClient,
  info: WaitingRoomGetQuery
): Promise<WaitingRoomResult> {
  const db = await client.db("waiting_room");
  const returnData = await (
    db.collection(camelCase(info.room)) as Collection<WaitingRoomState>
  )
    .find()
    .toArray();

  const currentRoom = returnData[0];
  if (!currentRoom) return [{ error: "room not found" }];

  console.log(decode(info.key, info.room.replace(" ", "_")));

  if (
    currentRoom.password &&
    currentRoom.password !== decode(info.key, info.room.replace(" ", "_"))
  )
    return [{ error: "password incorrect" }];

  const currentUsers = currentRoom.players;

  console.log(currentUsers);
  console.log(info);

  if (!currentUsers.some((player) => player.id == info.id))
    return [{ error: "user not found" }];

  console.log("RETURN DATA");
  console.log(returnData);

  return returnData;
}

async function joinRoom(
  client: MongoClient,
  info: WaitingRoomJoinQuery
): Promise<WaitingRoomResult> {
  const db = await client.db("waiting_room"),
    collection = (await db.collection(
      camelCase(info.room)
    )) as Collection<WaitingRoomState>;

  const current_object = await collection.findOne();
  if (!current_object) return [{ error: "room not found" }];

  if (current_object.password && current_object.password !== info.pw)
    return [{ error: "password incorrect" }];

  for (let i = 0; i < current_object.players.length; i++) {
    if (current_object.players[i]?.name === info.player) {
      console.log("player name is the same!");

      for (const socket in current_object.active ?? {}) {
        if (
          Number(current_object.active?.[socket]) === current_object.players[i]?.id
        )
          return [
            {
              error:
                "There is another active user with the same name! Choose a different name.",
            },
          ];
      }
      current_object.players[i]?.id;
    }
  }

  const players = current_object.players;

  players.push({ name: info.player, id: idGenerator(current_object.players) });

  const new_object = Object.assign(current_object, { players });

  console.log(new_object);

  // console.log("Set Room");
  await collection.updateOne(
    {},
    { $set: new_object },
    { upsert: true }
  );

  return [new_object];
}

async function addChatToRoom(
  client: MongoClient,
  info: { newChat: WaitingChatMessage; room: string }
): Promise<WaitingRoomResult> {
  const db = await client.db("waiting_room"),
    collection = (await db.collection(
      camelCase(info.room)
    )) as Collection<WaitingRoomState>;

  const current_object = await collection.findOne();
  if (!current_object) return [{ error: "room not found" }];

  const chats = [...current_object.chat];

  chats.push(info.newChat);

  const new_object = Object.assign(current_object, { chat: chats });

  await collection.updateOne(
    {},
    { $set: new_object },
    { upsert: true }
  );

  return [new_object];
}

async function setWaitingRoom(
  client: MongoClient,
  info: { data: Partial<WaitingRoomState>; room: string }
): Promise<WaitingRoomResult> {
  const db = await client.db("waiting_room"),
    collection = (await db.collection(
      camelCase(info.room)
    )) as Collection<WaitingRoomState>;

  const current_object = (await collection.findOne()) ?? ({} as WaitingRoomState);

  const active = {
    ...(current_object.active || {}),
    ...(info.data.active || {}),
  };
  const activeUpdatedAt = {
    ...(current_object.activeUpdatedAt || {}),
    ...(info.data.activeUpdatedAt || {}),
  };
  const now = Date.now();

  for (const sessionId of Object.keys(activeUpdatedAt)) {
    if (now - Number(activeUpdatedAt[sessionId]) > 15000) {
      delete activeUpdatedAt[sessionId];
      delete active[sessionId];
    }
  }

  const new_object = Object.assign(current_object, info.data, {
    active,
    activeUpdatedAt,
  });

  await collection.updateOne(
    {},
    { $set: new_object },
    { upsert: true }
  );

  return [new_object];
}

async function clearWaitingRoomSession(
  client: MongoClient,
  info: { room: string; sessionId: string }
): Promise<WaitingRoomResult> {
  const db = await client.db("waiting_room"),
    collection = (await db.collection(
      camelCase(info.room)
    )) as Collection<WaitingRoomState>;

  const currentObject = await collection.findOne();
  if (!currentObject) return [{ error: "room not found" }];

  const active = { ...(currentObject.active || {}) };
  const activeUpdatedAt = { ...(currentObject.activeUpdatedAt || {}) };

  delete active[info.sessionId];
  delete activeUpdatedAt[info.sessionId];

  const newObject = Object.assign(currentObject, {
    active,
    activeUpdatedAt,
  });

  await collection.updateOne({}, { $set: newObject }, { upsert: true });

  return [newObject];
}

async function createWaitingRoom(
  client: MongoClient,
  info: { room: WaitingRoomState; roomKey: string }
): Promise<WaitingRoomResult | false> {
  const db = await client.db("waiting_room");

  const collections = await db.listCollections().toArray();
  const exists = collections.findIndex((coll) => {
    return coll.name === info.roomKey;
  });

  const returnData: WaitingRoomResult = [info.room];

  if (exists === -1) {
    await db
      .collection(info.roomKey)
      .insertOne(Object.assign(info.room, { last_updated: Date.now() }));
  } else {
    // If the room exists, we need to see how long it’s been around
    // and how long it’s been since it’s been used

    // How long since the room was set up
    const collection = await (
      db.collection(info.roomKey) as Collection<WaitingRoomState>
    )
      .find()
      .toArray();
    const how_long_creation = Date.now() - (collection[0]?.last_updated ?? 0);

    // How long since it's been used
    const gameInfo = await fetchRoom(client, { room: info.room.roomName });
    const how_long_played = Array.isArray(gameInfo) && gameInfo[0]
      ? Date.now() - (gameInfo[0].last_updated ?? 0)
      : false;

    // Rooms will expire after 2 days after last play
    if (!how_long_played || how_long_played / 86400000 > 2) {
      // Unstarted rooms expire after 2 hours
      if (how_long_creation / 3600000 > 2) {
        // If the room is expired,
        // update it with the new information

        await db.collection(info.roomKey).updateOne(
          {},
          {
            $set: Object.assign(info.room, { last_updated: Date.now() }),
          },
          { upsert: true }
        );
      } else {
        console.log(
          "Room created " +
            Math.floor(how_long_creation / 60000) +
            " minutes ago."
        );
        return false;
      }
    } else {
      console.log(
        "Room last used " +
          Math.floor(how_long_played / 3600000) +
          " hours ago."
      );
      return false;
    }
  }

  return returnData;
}

module.exports = {
  getWaitRoom,
  joinWaitRoom,
  makeWaitRoom,
  removeActiveSession,
  updateActive,
  addChat,
};
