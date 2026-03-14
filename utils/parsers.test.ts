import { describe, expect, test } from "bun:test";
import { parseGameState, parseWaitingRoomState } from "./parsers";

describe("parsers", () => {
  test("parseGameState normalizes narrow gameplay state fields", () => {
    const parsed = parseGameState({
      _id: 0,
      deck: { cards: [{ id: 1, name: "stupefy", power: {} }], discards: [] },
      events: [
        {
          popup: { message: "Hi", options: [{ label: "Go", function: "go" }], popupType: "subtle" },
          "bystanders-22": { message: "Watch", options: [], popupType: "resolution" },
          target: [11],
        },
      ],
      players: [
        {
          id: 11,
          name: "Ada",
          power: ["albus_dumbledore", "not_real"],
          tableau: [],
          hand: [],
          character: { fileName: "albus_dumbledore", name: "Albus", shortName: "Albus", house: "G", health: 4, maxHealth: 4, power: {} },
        },
      ],
      table: [],
      turn: 11,
      turnCycle: {
        action: "stupefy",
        phase: "selected",
        used: ["james_potter", "unknown"],
        cards: [],
        draw: 1,
        felix: [],
        hotseat: -1,
        shots: 1,
        id22: { cards: [{ id: 2, name: "protego", power: {} }], choice: "takeHit" },
      },
      turnOrder: [11],
    });

    expect(parsed?.players[0]?.power).toEqual(["albus_dumbledore"]);
    expect(parsed?.turnCycle.used).toEqual(["james_potter"]);
    expect(parsed?.turnCycle.id22?.choice).toBe("takeHit");
    expect(parsed?.events?.[0]?.["bystanders-22"]?.message).toBe("Watch");
  });

  test("parseWaitingRoomState filters invalid presence and ready maps", () => {
    const parsed = parseWaitingRoomState({
      roomName: "Room",
      password: false,
      players: [{ id: 11, name: "Ada" }],
      chat: [{ player: 11, text: "Hi", time: 123 }],
      active: { one: "abc", two: {}, three: 9 },
      activeUpdatedAt: { one: 100, bad: "x" },
      ready: { "11": true, bad: "x" },
    });

    expect(parsed?.active).toEqual({ one: "abc", three: 9 });
    expect(parsed?.activeUpdatedAt).toEqual({ one: 100 });
    expect(parsed?.ready).toEqual({ "11": true });
  });
});
