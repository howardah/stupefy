import { describe, expect, test } from "bun:test";
import {
  areAllPlayersReady,
  ensureReadyMap,
  normalizeGameRoom,
  playersForGame,
  prunePresence,
} from "./lifecycle";

describe("waiting-room lifecycle helpers", () => {
  test("prunePresence removes stale sessions and preserves active ones", () => {
    const originalNow = Date.now;
    Date.now = () => 20_000;

    const room = prunePresence({
      active: { fresh: "fresh", stale: "stale" },
      activeUpdatedAt: { fresh: 19_000, stale: 1_000 },
      chat: [],
      password: false,
      players: [{ id: 11, name: "Ada" }],
      roomName: "Table",
    });

    Date.now = originalNow;

    expect(room.active).toEqual({ fresh: "fresh" });
    expect(room.activeUpdatedAt).toEqual({ fresh: 19_000 });
  });

  test("ensureReadyMap and areAllPlayersReady align with the player list", () => {
    const room = {
      chat: [],
      password: false as const,
      players: [
        { id: 11, name: "Ada" },
        { id: 22, name: "Bea" },
      ],
      ready: { "11": true, "99": true },
      roomName: "Table",
    };

    expect(ensureReadyMap(room)).toEqual({ "11": true, "22": false });
    expect(areAllPlayersReady(room)).toBe(false);
    expect(areAllPlayersReady({ ...room, ready: { "11": true, "22": true } })).toBe(true);
  });

  test("playersForGame and normalizeGameRoom prepare runtime-safe state", () => {
    const players = playersForGame({
      chat: [],
      password: false as const,
      players: [{ id: 11, name: "Ada" }],
      roomName: "Table",
    });

    expect(players).toEqual([
      {
        character: [],
        hand: [],
        id: 11,
        name: "Ada",
        power: [],
        tableau: [],
      },
    ]);

    expect(normalizeGameRoom(null)).toBeNull();
    expect(normalizeGameRoom({
      deck: { cards: [], discards: [] },
      players,
      turn: 11,
      turnCycle: {
        action: "",
        cards: [],
        draw: 2,
        felix: [],
        hotseat: -1,
        phase: "initial",
        shots: 1,
        used: [],
      },
      turnOrder: [11],
    })?.status).toBe("active");
  });
});
