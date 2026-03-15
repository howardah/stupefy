import type { Ref } from "vue";
import type { BoardViewState, GameplayTarget } from "@shared/utils/types";

interface UsePlayStatusItemsOptions {
  availableTargets: Ref<GameplayTarget[]>;
  boardState: Ref<BoardViewState | null>;
  lastSyncedAt: Ref<number | null>;
  playerId: Ref<number>;
}

export function usePlayStatusItems(options: UsePlayStatusItemsOptions) {
  const statusItems = computed(() => {
    if (!options.boardState.value) {
      return [];
    }

    return [
      `You: ${options.playerId.value || "?"}`,
      `Phase: ${options.boardState.value.turnCycle.phase}`,
      `Targets: ${options.availableTargets.value.join(", ") || "None"}`,
      `Updated: ${options.lastSyncedAt.value ? new Date(options.lastSyncedAt.value).toLocaleTimeString() : "Waiting"}`,
    ];
  });

  return { statusItems };
}
