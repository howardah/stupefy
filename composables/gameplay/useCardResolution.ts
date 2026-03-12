import type { ComputedRef } from "vue";
import type { BoardViewState } from "~/utils/types";
import { resolveSystemEvent } from "~/utils/gameplay/events";

export function useCardResolution(boardState: ComputedRef<BoardViewState | null>) {
  const currentEvent = computed(() => boardState.value?.events[0] ?? null);

  const systemResolution = computed(() => {
    if (!boardState.value || !currentEvent.value?.cardType) return false;

    return resolveSystemEvent(
      currentEvent.value.cardType,
      boardState.value.turnOrder,
      currentEvent.value.popup?.message || ""
    );
  });

  return {
    currentEvent,
    systemResolution,
  };
}
