import type { ComputedRef, Ref } from "vue";
import type { GameRoomApiResponse, GameState, PlayQuery } from "~/utils/types";
import { sampleGameRoomSnapshot } from "~/fixtures/sample-game-room";
import { countAllCards, createBoardViewState } from "~/utils/gameplay/bootstrap";

interface UseRoomStateOptions {
  playQuery: ComputedRef<PlayQuery>;
  roomState: Ref<GameRoomApiResponse | null | undefined>;
}

export function useRoomState(options: UseRoomStateOptions) {
  const currentRoom = computed<GameState | null>(() => {
    if (!Array.isArray(options.roomState.value) || !options.roomState.value[0]) {
      return null;
    }

    return options.roomState.value[0] as GameState;
  });

  const boardState = computed(() =>
    currentRoom.value
      ? createBoardViewState(currentRoom.value, options.playQuery.value)
      : null
  );

  const fixtureBoardState = computed(() =>
    createBoardViewState(sampleGameRoomSnapshot, options.playQuery.value)
  );

  const cardCount = computed(() =>
    boardState.value ? countAllCards(boardState.value) : null
  );

  return {
    boardState,
    cardCount,
    currentRoom,
    fixtureBoardState,
  };
}
