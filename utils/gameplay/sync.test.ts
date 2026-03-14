import { describe, expect, test } from "bun:test";
import { sampleGameRoomSnapshot } from "../../fixtures/sample-game-room";
import { createBoardViewState } from "./bootstrap";
import { createGameStatePatch, getGameplaySyncSignature } from "./sync";

describe("gameplay sync helpers", () => {
  test("createGameStatePatch returns a detached gameplay snapshot", () => {
    const boardState = createBoardViewState(structuredClone(sampleGameRoomSnapshot), {
      id: 11,
      room: "Sample Room",
    });

    const patch = createGameStatePatch(boardState);

    boardState.players[0]!.hand[0]!.name = "changed";
    boardState.deadPlayers.push(99);

    expect(patch.players?.[0]?.hand[0]?.name).toBe("stupefy");
    expect(patch.deadPlayers).toEqual([]);
  });

  test("getGameplaySyncSignature changes when gameplay state changes", () => {
    const boardState = createBoardViewState(structuredClone(sampleGameRoomSnapshot), {
      id: 11,
      room: "Sample Room",
    });

    const initialSignature = getGameplaySyncSignature(boardState);

    boardState.turn = 22;

    expect(getGameplaySyncSignature(boardState)).not.toBe(initialSignature);
  });
});
