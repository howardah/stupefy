import type { ComputedRef } from "vue";
import type { BoardViewState } from "~/utils/types";
import { getAvailableTargets, getCardTargets } from "~/utils/gameplay/targeting";

export function useCardTargets(boardState: ComputedRef<BoardViewState | null>) {
  const availableTargets = computed(() =>
    boardState.value ? getAvailableTargets(boardState.value) : [],
  );

  const actionTargets = computed(() =>
    boardState.value
      ? getCardTargets(boardState.value.turnCycle.action, boardState.value.turnCycle)
      : [],
  );

  return {
    actionTargets,
    availableTargets,
  };
}
