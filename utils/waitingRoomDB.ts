import type { Collection, MongoClient } from "mongodb";
import type {
  ErrorResult,
  GameState,
  WaitingChatMessage,
  WaitingRoomAccessState,
  WaitingPlayer,
  WaitingRoomCreateQuery,
  WaitingRoomGetQuery,
  WaitingRoomJoinQuery,
  WaitingRoomState,
} from "./types";
import { idGenerator } from "./db-tools";
import { decode } from "./encrypt";
import { createMongoClient } from "./mongo-client";
import { parseGameState, parseWaitingRoomState } from "./parsers";
import { normalizeRoomKey, normalizeRoomName, roomPasswordKey } from "./room";

type WaitingRoomResult = Array<ErrorResult | WaitingRoomState>;

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
  room: string
): Promise<Collection<WaitingRoomState>> {
  return client
    .db("waiting_room")
    .collection<WaitingRoomState>(normalizeRoomKey(room));
}

async function getGameCollection(
  client: MongoClient,
  room: string
): Promise<Collection<GameState>> {
  return client.db("stupefy").collection<GameState>(normalizeRoomKey(room));
}

function prunePresence(room: WaitingRoomState): WaitingRoomState {
  const active = { ...(room.active || {}) };
  const activeUpdatedAt = { ...(room.activeUpdatedAt || {}) };
  const now = Date.now();

  for (const sessionId of Object.keys(activeUpdatedAt)) {
    if (now - Number(activeUpdatedAt[sessionId]) > 15000) {
      delete activeUpdatedAt[sessionId];
      delete active[sessionId];
    }
  }

  return {
    ...room,
    active,
    activeUpdatedAt,
  };
}

async function readWaitingRoom(
  client: MongoClient,
  room: string
): Promise<WaitingRoomState | null> {
  const collection = await getWaitingCollection(client, room);
  const parsed = parseWaitingRoomState(await collection.findOne());
  return parsed ? prunePresence(parsed) : null;
}

async function writeWaitingRoom(
  client: MongoClient,
  room: string,
  nextState: WaitingRoomState
): Promise<WaitingRoomState> {
  const collection = await getWaitingCollection(client, room);
  const pruned = prunePresence(nextState);

  await collection.replaceOne({}, pruned, { upsert: true });
  return pruned;
}

async function getWaitRoom(
  data: WaitingRoomGetQuery
): Promise<WaitingRoomResult | undefined> {
  return withClient(async (client) => {
    const currentRoom = await readWaitingRoom(client, data.room);
    if (!currentRoom) return [{ error: "room not found" }];

    if (
      currentRoom.password &&
      currentRoom.password !== decode(data.key, roomPasswordKey(data.room))
    ) {
      return [{ error: "password incorrect" }];
    }

    if (!currentRoom.players.some((player) => player.id == data.id)) {
      return [{ error: "user not found" }];
    }

    return [currentRoom];
  });
}

async function getWaitRoomAccess(room: string): Promise<WaitingRoomAccessState> {
  return withClient(async (client) => {
    const currentRoom = await readWaitingRoom(client, room);

    if (!currentRoom) {
      return {
        exists: false,
        hasPassword: false,
        roomName: normalizeRoomName(room),
      };
    }

    return {
      exists: true,
      hasPassword: typeof currentRoom.password === "string" && currentRoom.password.length > 0,
      roomName: currentRoom.roomName,
    };
  });
}

async function joinWaitRoom(
  data: WaitingRoomJoinQuery
): Promise<WaitingRoomResult | undefined> {
  return withClient(async (client) => {
    const currentRoom = await readWaitingRoom(client, data.room);
    if (!currentRoom) return [{ error: "room not found" }];

    if (currentRoom.password && currentRoom.password !== data.pw) {
      return [{ error: "password incorrect" }];
    }

    const duplicateName = currentRoom.players.find((player) => player.name === data.player);
    if (duplicateName) {
      for (const sessionId in currentRoom.active || {}) {
        if (Number(currentRoom.active?.[sessionId]) === duplicateName.id) {
          return [
            {
              error:
                "There is another active user with the same name! Choose a different name.",
            },
          ];
        }
      }
    }

    const nextState: WaitingRoomState = {
      ...currentRoom,
      players: [
        ...currentRoom.players,
        { name: data.player, id: idGenerator(currentRoom.players) },
      ],
    };

    return [await writeWaitingRoom(client, data.room, nextState)];
  });
}

async function updateActive(data: {
  data: Partial<WaitingRoomState>;
  room: string;
}): Promise<WaitingRoomResult | undefined> {
  return withClient(async (client) => {
    const currentRoom =
      (await readWaitingRoom(client, data.room)) ??
      ({
        active: {},
        activeUpdatedAt: {},
        chat: [],
        password: false,
        players: [],
        roomName: normalizeRoomName(data.room),
      } as WaitingRoomState);

    const nextState: WaitingRoomState = {
      ...currentRoom,
      ...data.data,
      active: {
        ...(currentRoom.active || {}),
        ...(data.data.active || {}),
      },
      activeUpdatedAt: {
        ...(currentRoom.activeUpdatedAt || {}),
        ...(data.data.activeUpdatedAt || {}),
      },
    };

    return [await writeWaitingRoom(client, data.room, nextState)];
  });
}

async function removeActiveSession(data: {
  room: string;
  sessionId: string;
}): Promise<WaitingRoomResult | undefined> {
  return withClient(async (client) => {
    const currentRoom = await readWaitingRoom(client, data.room);
    if (!currentRoom) return [{ error: "room not found" }];

    const active = { ...(currentRoom.active || {}) };
    const activeUpdatedAt = { ...(currentRoom.activeUpdatedAt || {}) };

    delete active[data.sessionId];
    delete activeUpdatedAt[data.sessionId];

    return [
      await writeWaitingRoom(client, data.room, {
        ...currentRoom,
        active,
        activeUpdatedAt,
      }),
    ];
  });
}

async function addChat(data: {
  newChat: WaitingChatMessage;
  room: string;
}): Promise<WaitingChatMessage[] | undefined> {
  return withClient(async (client) => {
    const currentRoom = await readWaitingRoom(client, data.room);
    if (!currentRoom) return undefined;

    const nextState = await writeWaitingRoom(client, data.room, {
      ...currentRoom,
      chat: [...currentRoom.chat, data.newChat],
    });

    return nextState.chat;
  });
}

async function makeWaitRoom(
  info: WaitingRoomCreateQuery
): Promise<WaitingRoomResult | false | undefined> {
  return withClient(async (client) => {
    const roomName = normalizeRoomName(info.room);
    const currentRoom = await readWaitingRoom(client, roomName);
    const players: WaitingPlayer[] = [{ name: info.player, id: idGenerator([]) }];

    const freshRoom: WaitingRoomState = {
      active: {},
      activeUpdatedAt: {},
      chat: [
        {
          text:
            "Once everyone has joined the room, you can click “Start Game” to set up the actual game.",
          player: 100,
          time: Date.now(),
        },
      ],
      password: info.pw || false,
      players,
      roomName,
    };

    if (!currentRoom) {
      return [await writeWaitingRoom(client, roomName, freshRoom)];
    }

    const gameCollection = await getGameCollection(client, roomName);
    const currentGame = parseGameState(await gameCollection.findOne());
    const howLongCreation = Date.now() - (currentRoom.last_updated ?? 0);
    const howLongPlayed = currentGame?.last_updated
      ? Date.now() - currentGame.last_updated
      : false;

    if (!howLongPlayed || howLongPlayed / 86400000 > 2) {
      if (howLongCreation / 3600000 > 2) {
        return [await writeWaitingRoom(client, roomName, freshRoom)];
      }

      console.log(
        "Room created " + Math.floor(howLongCreation / 60000) + " minutes ago."
      );
      return false;
    }

    console.log(
      "Room last used " + Math.floor(howLongPlayed / 3600000) + " hours ago."
    );
    return false;
  });
}

export {
  addChat,
  getWaitRoom,
  getWaitRoomAccess,
  joinWaitRoom,
  makeWaitRoom,
  removeActiveSession,
  updateActive,
};
