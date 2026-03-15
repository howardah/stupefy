import { describe, expect, test } from "bun:test";
import { sampleGameRoomSnapshot } from "../../../fixtures/sample-game-room";
import {
  canApparateBetween,
  checkPlayerDistance,
  currentRoleCardClass,
  isCharacterTargetClickable,
  isDeckTargetClickable,
  isHandTargetClickable,
  isTableCardClickable,
  isTableauTargetClickable,
  rotatePlayersForViewer,
} from "./board-ui";
import { createBoardViewState } from "./bootstrap";

describe("board UI helpers", () => {
  test("rotatePlayersForViewer starts the list with the viewer when possible", () => {
    const players = structuredClone(sampleGameRoomSnapshot.players);

    expect(rotatePlayersForViewer(players, 22).map((player) => player.id)).toEqual([22, 33, 11]);
  });

  test("checkPlayerDistance honors wand range and opposing distance effects", () => {
    const players = structuredClone(sampleGameRoomSnapshot.players);
    players.push({
      character: {
        fileName: "ron_weasley",
        name: "Ron Weasley",
        shortName: "Ron",
        house: "G",
        health: 4,
        maxHealth: 4,
        power: {},
      },
      hand: [],
      id: 44,
      name: "Dee",
      power: [],
      tableau: [],
    });
    players[0]!.tableau = [
      { id: 1, name: "larch_wand", fileName: "larch_wand", house: "G", power: { range: 4 } },
    ];
    players[1]!.tableau = [
      { id: 2, name: "broomstick", fileName: "broomstick", house: "S", power: { distance: 1 } },
    ];

    expect(checkPlayerDistance(players, 11, 22)).toBe(true);
    expect(checkPlayerDistance(players, 11, 33, 1)).toBe(false);
  });

  test("target clickability helpers reflect the available target tokens", () => {
    const state = createBoardViewState(structuredClone(sampleGameRoomSnapshot), {
      id: 11,
      room: "Sample Room",
    });
    const self = state.players[0]!;
    const opponent = state.players[1]!;
    const tableauCard = opponent.tableau[0]!;
    const tableCard = state.table[0]!;

    expect(isHandTargetClickable(self, 11, ["my-hand"], state.players)).toBe(true);
    expect(isCharacterTargetClickable(opponent, 11, ["characters"], state.players)).toBe(true);
    expect(isTableauTargetClickable(opponent, 11, ["tableau"], state.players, tableauCard)).toBe(
      true,
    );
    expect(isTableCardClickable(tableCard, ["table"])).toBe(true);
    expect(isDeckTargetClickable(["draw"], "draw")).toBe(true);
    expect(canApparateBetween(1, state.players, ["between-characters"])).toBe(true);
    expect(currentRoleCardClass(state)).toBe("minister");
  });
});
