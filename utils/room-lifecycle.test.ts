import { describe, expect, test } from "bun:test";
import { sampleGameRoomSnapshot } from "../fixtures/sample-game-room";
import {
  applyGameRoomLifecycle,
  applyWaitingRoomLifecycle,
  GAME_ROOM_IDLE_TTL_MS,
  isGameRoomActive,
  isWaitingRoomAvailable,
  WAITING_ROOM_IDLE_TTL_MS,
} from "./room-lifecycle";

describe("room lifecycle", () => {
  test("applyWaitingRoomLifecycle derives waiting expiration and archives idle rooms", () => {
    const now = 1_000_000;
    const waitingRoom = applyWaitingRoomLifecycle(
      {
        chat: [],
        password: false,
        players: [{ id: 11, name: "Ada" }],
        roomName: "Table",
        last_updated: now - WAITING_ROOM_IDLE_TTL_MS - 1,
      },
      now,
    );

    expect(waitingRoom.status).toBe("archived");
    expect(waitingRoom.archivedAt).toBe(now);
    expect(waitingRoom.expiresAt).toBe(now - 1);
  });

  test("applyGameRoomLifecycle defaults active rooms and archives expired ones", () => {
    const active = applyGameRoomLifecycle({ ...structuredClone(sampleGameRoomSnapshot), last_updated: 500 }, 600);
    const archived = applyGameRoomLifecycle(
      { ...structuredClone(sampleGameRoomSnapshot), expiresAt: 10, last_updated: 5 },
      GAME_ROOM_IDLE_TTL_MS,
    );

    expect(active.status).toBe("active");
    expect(active.startedAt).toBe(active.createdAt);
    expect(archived.status).toBe("archived");
    expect(isGameRoomActive(active)).toBe(true);
    expect(isWaitingRoomAvailable({ chat: [], password: false, players: [], roomName: "X", status: "waiting" })).toBe(true);
  });
});
