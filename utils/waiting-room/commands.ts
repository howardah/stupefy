import type {
  ErrorResult,
  GameState,
  WaitingChatMessage,
  WaitingPlayer,
  WaitingRoomCreateQuery,
  WaitingRoomJoinQuery,
  WaitingRoomState,
} from "../types";
import { idGenerator } from "../db-tools";
import { newRoom } from "../new-room";
import {
  isGameRoomActive,
  isWaitingRoomAvailable,
} from "../room-lifecycle";
import { normalizeRoomKey, normalizeRoomName } from "../room";
import {
  areAllPlayersReady,
  ensureReadyMap,
  playersForGame,
} from "./lifecycle";
import {
  readGameRoom,
  readWaitingRoom,
  withClient,
  writeWaitingRoom,
} from "./repository";

type WaitingRoomResult = Array<ErrorResult | WaitingRoomState>;

async function joinWaitRoom(
  data: WaitingRoomJoinQuery,
): Promise<WaitingRoomResult | undefined> {
  return withClient(async (client) => {
    const currentRoom = await readWaitingRoom(client, data.room);
    if (!currentRoom) {
      return [{ error: "room not found" }];
    }
    if (!isWaitingRoomAvailable(currentRoom)) {
      return [{ error: "game already started" }];
    }

    if (currentRoom.password && currentRoom.password !== data.pw) {
      return [{ error: "password incorrect" }];
    }

    const duplicateName = currentRoom.players.find((player) => player.name === data.player);
    if (duplicateName) {
      for (const sessionId in currentRoom.active || {}) {
        if (Number(currentRoom.active?.[sessionId]) === duplicateName.id) {
          return [
            {
              error: "There is another active user with the same name! Choose a different name.",
            },
          ];
        }
      }
    }

    const newPlayer = { name: data.player, id: idGenerator(currentRoom.players) };
    const nextPlayers = [...currentRoom.players, newPlayer];
    const nextState: WaitingRoomState = {
      ...currentRoom,
      players: nextPlayers,
      ready: ensureReadyMap({
        ...currentRoom,
        players: nextPlayers,
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
        createdAt: Date.now(),
        active: {},
        activeUpdatedAt: {},
        chat: [],
        expiresAt: undefined,
        password: false,
        players: [],
        ready: {},
        roomName: normalizeRoomName(data.room),
        status: "waiting",
      } as WaitingRoomState);

    const nextPlayers = data.data.players || currentRoom.players;
    const nextState: WaitingRoomState = {
      ...currentRoom,
      ...data.data,
      status: currentRoom.status ?? "waiting",
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
        players: nextPlayers,
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
    if (!currentRoom) {
      return [{ error: "room not found" }];
    }
    if (!isWaitingRoomAvailable(currentRoom)) {
      return [{ error: "game already started" }];
    }

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
    if (!currentRoom) {
      return [{ error: "room not found" }];
    }

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
    if (!currentRoom || currentRoom.status === "archived") {
      return undefined;
    }

    const nextState = await writeWaitingRoom(client, data.room, {
      ...currentRoom,
      chat: [...currentRoom.chat, data.newChat],
    });

    return nextState.chat;
  });
}

async function makeWaitRoom(
  info: WaitingRoomCreateQuery,
): Promise<WaitingRoomResult | false | undefined> {
  return withClient(async (client) => {
    const roomName = normalizeRoomName(info.room);
    const currentRoom = await readWaitingRoom(client, roomName);
    const players: WaitingPlayer[] = [{ name: info.player, id: idGenerator([]) }];
    const now = Date.now();

    const freshRoom: WaitingRoomState = {
      active: {},
      activeUpdatedAt: {},
      createdAt: now,
      chat: [
        {
          text:
            "Once everyone has joined the room, each player can click Ready. The game launches automatically once everyone is ready.",
          player: 100,
          time: Date.now(),
        },
      ],
      expiresAt: undefined,
      last_updated: now,
      password: info.pw || false,
      players,
      ready: { [String(players[0]?.id || 0)]: false },
      roomName,
      status: "waiting",
    };

    if (!currentRoom) {
      return [await writeWaitingRoom(client, roomName, freshRoom)];
    }

    const currentGame = await readGameRoom(client, roomName);

    if (currentRoom.status === "archived") {
      return [await writeWaitingRoom(client, roomName, freshRoom)];
    }

    if (!currentGame || !isGameRoomActive(currentGame)) {
      if (!isWaitingRoomAvailable(currentRoom)) {
        return [await writeWaitingRoom(client, roomName, freshRoom)];
      }

      return false;
    }

    return false;
  });
}

async function startWaitRoomGame(room: string): Promise<GameState[] | undefined> {
  return withClient(async (client) => {
    const currentRoom = await readWaitingRoom(client, room);
    if (!currentRoom) {
      return undefined;
    }

    const roomKey = normalizeRoomKey(room);
    const existingGame = await readGameRoom(client, roomKey);

    if (currentRoom.status === "in-game" && existingGame && isGameRoomActive(existingGame)) {
      return [existingGame];
    }

    if (!areAllPlayersReady(currentRoom) || !isWaitingRoomAvailable(currentRoom)) {
      return undefined;
    }

    const gameRooms = await newRoom({
      players: playersForGame(currentRoom),
      room: roomKey,
      sourceWaitingRoom: currentRoom.roomName,
    });

    if (!gameRooms?.[0]) {
      return undefined;
    }

    await writeWaitingRoom(client, room, {
      ...currentRoom,
      expiresAt: undefined,
      gameRoomKey: roomKey,
      last_updated: Date.now(),
      startedAt: currentRoom.startedAt ?? Date.now(),
      status: "in-game",
    });

    return gameRooms;
  });
}

export {
  addChat,
  joinWaitRoom,
  makeWaitRoom,
  removeActiveSession,
  startWaitRoomGame,
  updateActive,
  updateReadyStatus,
};
