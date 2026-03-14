import { describe, expect, test } from "bun:test";
import { cycleCleanse, incrementTurn } from "./turn-cycle";
import { createGameplayTestState } from "./test-helpers";

describe("turn transitions", () => {
  test("incrementTurn skips dead players", () => {
    expect(incrementTurn(11, [11, 22, 33], [22])).toBe(33);
  });

  test("cycleCleanse preserves spent shots for normal players", () => {
    const state = createGameplayTestState(11);
    state.turnCycle.shots = 0;
    state.players[0]!.tableau = [];
    state.players[0]!.power = ["albus_dumbledore"];
    const character = Array.isArray(state.players[0]!.character)
      ? state.players[0]!.character[0]!
      : state.players[0]!.character;
    character.fileName = "albus_dumbledore";

    const cleansed = cycleCleanse(state.turnCycle, state.players, state.turn);

    expect(cleansed.shots).toBe(0);
    expect(cleansed.phase).toBe("initial");
  });
});
