import type { ComputedRef } from "vue";
import type { BoardViewState } from "@shared/utils/types";
import {
  createBaseTurnCycle,
  incrementTurn,
  setupTurnCycleForTurn,
} from "@shared/utils/gameplay/turn-cycle";
import { playerIndex } from "@shared/utils/gameplay/core";

export function useTurnCycle(boardState: ComputedRef<BoardViewState | null>) {
  const currentPlayer = computed(() => {
    if (!boardState.value) return null;

    const index = playerIndex(boardState.value.players, boardState.value.turn);
    return index === -1 ? null : boardState.value.players[index]!;
  });

  const nextTurn = computed(() => {
    if (!boardState.value) return null;

    return incrementTurn(
      boardState.value.turn,
      boardState.value.turnOrder,
      boardState.value.deadPlayers,
    );
  });

  const setupPreview = computed(() => {
    if (!boardState.value || nextTurn.value === null) return null;

    return setupTurnCycleForTurn(boardState.value.players, nextTurn.value);
  });

  const resetPreview = computed(() => {
    if (!boardState.value) return null;

    return createBaseTurnCycle(boardState.value.players, boardState.value.turn);
  });

  return {
    currentPlayer,
    nextTurn,
    resetPreview,
    setupPreview,
  };
}
