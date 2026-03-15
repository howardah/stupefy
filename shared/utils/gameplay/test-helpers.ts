import { sampleGameRoomSnapshot } from "../../../fixtures/sample-game-room";
import { createBoardViewState } from "./bootstrap";

function createGameplayTestState(playerId = 11) {
  return createBoardViewState(structuredClone(sampleGameRoomSnapshot), {
    id: playerId,
    room: "Sample Room",
  });
}

export { createGameplayTestState };
