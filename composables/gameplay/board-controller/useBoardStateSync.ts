import type { ComputedRef } from "vue";
import type { BoardMutationKind, BoardViewState } from "~/utils/types";
import { cloneBoardViewState } from "~/utils/gameplay/bootstrap";
import { getGameplaySyncSignature } from "~/utils/gameplay/sync";
import { syncActions } from "./helpers";

function useBoardStateSync(
  sourceBoardState: ComputedRef<BoardViewState | null>,
  pushAlert: (message: string, tone?: "info" | "warning" | "error") => void,
  clearAlerts: () => void,
) {
  const localBoardState = ref<BoardViewState | null>(null);
  const mutationNonce = ref(0);
  const authoritativeSignature = ref<string | null>(null);

  watch(
    sourceBoardState,
    (nextState) => {
      const nextSignature = nextState ? getGameplaySyncSignature(nextState) : null;

      if (nextSignature === authoritativeSignature.value) {
        return;
      }

      authoritativeSignature.value = nextSignature;
      localBoardState.value = nextState ? cloneBoardViewState(nextState) : null;
      clearAlerts();
    },
    { immediate: true },
  );

  function resetBoard() {
    localBoardState.value = sourceBoardState.value
      ? cloneBoardViewState(sourceBoardState.value)
      : null;
    clearAlerts();
  }

  function withBoardState(
    action: (state: BoardViewState) => void | boolean | BoardViewState,
    fallbackMessage?: string,
    kind: BoardMutationKind = "gameplay",
  ) {
    if (!localBoardState.value) {
      return;
    }

    const next = cloneBoardViewState(localBoardState.value);
    const previousSignature = getGameplaySyncSignature(localBoardState.value);
    const result = action(next);

    if (result === false) {
      if (fallbackMessage) {
        pushAlert(fallbackMessage, "error");
      }
      return;
    }

    localBoardState.value = result && typeof result === "object" && result !== next ? result : next;
    syncActions(localBoardState.value);

    if (kind === "gameplay") {
      const nextSignature = getGameplaySyncSignature(localBoardState.value);
      if (nextSignature !== previousSignature) {
        mutationNonce.value += 1;
      }
    }
  }

  return {
    boardState: computed(() => localBoardState.value),
    mutationNonce,
    resetBoard,
    withBoardState,
  };
}

export { useBoardStateSync };
