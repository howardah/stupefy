import type {
  ErrorResult,
  OpenWaitingRoomSummary,
  WaitingRoomAccessState,
  WaitingRoomGetQuery,
  WaitingRoomState,
} from "../types";
import { decode } from "../encrypt";
import { isGameRoomActive, isWaitingRoomAvailable } from "../room-lifecycle";
import { normalizeRoomKey, normalizeRoomName, roomPasswordKey } from "../room";
import { prunePresence } from "./lifecycle";
import {
  getWaitingCollection,
  listWaitingCollectionNames,
  readGameRoom,
  readWaitingRoom,
  withClient,
  writeWaitingRoom,
} from "./repository";

type WaitingRoomResult = Array<ErrorResult | WaitingRoomState>;

async function getWaitRoom(data: WaitingRoomGetQuery): Promise<WaitingRoomResult | undefined> {
  return withClient(async (client) => {
    const currentRoom = await readWaitingRoom(client, data.room);
    if (!currentRoom) {
      return [{ error: "room not found" }];
    }
    if (currentRoom.status === "archived") {
      return [{ error: "room archived" }];
    }

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

    if (!currentRoom || currentRoom.status === "archived") {
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
    const roomKeys = await listWaitingCollectionNames(client);
    const openRooms = await Promise.all(
      roomKeys.map(async (roomKey) => {
        const _waitingCollection = await getWaitingCollection(client, roomKey);
        const waitingRoom = await readWaitingRoom(client, roomKey);

        if (!waitingRoom) {
          return null;
        }
        if (!isWaitingRoomAvailable(waitingRoom)) {
          await writeWaitingRoom(client, roomKey, waitingRoom);
          return null;
        }
        if (typeof waitingRoom.password === "string" && waitingRoom.password.length > 0) {
          return null;
        }

        const existingGame = await readGameRoom(client, normalizeRoomKey(roomKey));
        if (existingGame && isGameRoomActive(existingGame)) {
          return null;
        }

        const prunedRoom = prunePresence(waitingRoom);

        return {
          activeCount: Object.keys(prunedRoom.active || {}).length,
          playerCount: prunedRoom.players.length,
          roomName: prunedRoom.roomName,
          updatedAt: Number(prunedRoom.last_updated || 0),
        } satisfies OpenWaitingRoomSummary;
      }),
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

export { getWaitRoom, getWaitRoomAccess, listOpenWaitRooms };
