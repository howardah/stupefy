import type { Collection, MongoClient } from "mongodb";
import type {
  ErrorResult,
  GameState,
  OpenWaitingRoomSummary,
  PlayerState,
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
import { newRoom } from "./new-room";
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

async function listWaitingCollections(client: MongoClient): Promise<string[]> {
  const collections = await client.db("waiting_room").listCollections().toArray();
  return collections
    .map((collection) => collection.name)
    .filter((name): name is string => typeof name === "string" && name.length > 0);
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
    ready: { ...(room.ready || {}) },
  };
}

function ensureReadyMap(room: WaitingRoomState): Record<string, boolean> {
  const ready = { ...(room.ready || {}) };

  for (const player of room.players) {
    const key = String(player.id);
    if (ready[key] !== true) {
      ready[key] = false;
    }
  }

  for (const key of Object.keys(ready)) {
    if (!room.players.some((player) => String(player.id) === key)) {
      delete ready[key];
    }
  }

  return ready;
}

function areAllPlayersReady(room: WaitingRoomState): boolean {
  if (room.players.length === 0) return false;

  const ready = ensureReadyMap(room);
  return room.players.every((player) => ready[String(player.id)] === true);
}

function playersForGame(room: WaitingRoomState): PlayerState[] {
  return room.players.map((player) => ({
    character: [],
    hand: [],
    id: Number(player.id),
    name: player.name,
    power: [],
    tableau: [],
  }));
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

async function listOpenWaitRooms(): Promise<OpenWaitingRoomSummary[]> {
  return withClient(async (client) => {
    const roomKeys = await listWaitingCollections(client);
    const openRooms = await Promise.all(
      roomKeys.map(async (roomKey) => {
        const waitingCollection = await getWaitingCollection(client, roomKey);
        const waitingRoom = parseWaitingRoomState(await waitingCollection.findOne());

        if (!waitingRoom) return null;
        if (typeof waitingRoom.password === "string" && waitingRoom.password.length > 0) {
          return null;
        }

        const gameCollection = await getGameCollection(client, roomKey);
        const existingGame = parseGameState(await gameCollection.findOne());
        if (existingGame) {
          return null;
        }

        const prunedRoom = prunePresence(waitingRoom);

        return {
          activeCount: Object.keys(prunedRoom.active || {}).length,
          playerCount: prunedRoom.players.length,
          roomName: prunedRoom.roomName,
          updatedAt: Number(prunedRoom.last_updated || 0),
        } satisfies OpenWaitingRoomSummary;
      })
    );

    return openRooms
      .filter((room): room is OpenWaitingRoomSummary => room !== null)
      .sort((left, right) => {
        if (right.updatedAt !== left.updatedAt) {
          return right.updatedAt - left.updatedAt;
        }

        return left.roomName.localeCompare(right.roomName);
      });
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

    const newPlayer = { name: data.player, id: idGenerator(currentRoom.players) };
    const nextState: WaitingRoomState = {
      ...currentRoom,
      players: [...currentRoom.players, newPlayer],
      ready: ensureReadyMap({
        ...currentRoom,
        players: [...currentRoom.players, newPlayer],
      } as WaitingRoomState),
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
        ready: {},
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
      ready: ensureReadyMap({
        ...currentRoom,
        ...data.data,
        players: data.data.players || currentRoom.players,
        ready: {
          ...(currentRoom.ready || {}),
          ...((data.data.ready as Record<string, boolean> | undefined) || {}),
        },
      } as WaitingRoomState),
    };

    return [await writeWaitingRoom(client, data.room, nextState)];
  });
}

async function updateReadyStatus(data: {
  playerId: number | string;
  ready: boolean;
  room: string;
}): Promise<WaitingRoomResult | undefined> {
  return withClient(async (client) => {
    const currentRoom = await readWaitingRoom(client, data.room);
    if (!currentRoom) return [{ error: "room not found" }];

    const playerKey = String(data.playerId);
    if (!currentRoom.players.some((player) => String(player.id) === playerKey)) {
      return [{ error: "user not found" }];
    }

    return [
      await writeWaitingRoom(client, data.room, {
        ...currentRoom,
        ready: {
          ...ensureReadyMap(currentRoom),
          [playerKey]: data.ready,
        },
      }),
    ];
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
            "Once everyone has joined the room, each player can click Ready. The game launches automatically once everyone is ready.",
          player: 100,
          time: Date.now(),
        },
      ],
      password: info.pw || false,
      players,
      ready: { [String(players[0]?.id || 0)]: false },
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

async function startWaitRoomGame(room: string): Promise<GameState[] | undefined> {
  return withClient(async (client) => {
    const currentRoom = await readWaitingRoom(client, room);
    if (!currentRoom || !areAllPlayersReady(currentRoom)) {
      return undefined;
    }

    return newRoom({
      players: playersForGame(currentRoom),
      room: normalizeRoomKey(room),
    });
  });
}

export {
  addChat,
  getWaitRoom,
  getWaitRoomAccess,
  joinWaitRoom,
  listOpenWaitRooms,
  makeWaitRoom,
  removeActiveSession,
  startWaitRoomGame,
  updateReadyStatus,
  updateActive,
};
