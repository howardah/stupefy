import type { ComputedRef } from "vue";
import type { BoardAlert, BoardViewState } from "@shared/utils/types";

export function useBoardActions(boardState: ComputedRef<BoardViewState | null>) {
  const alerts = ref<BoardAlert[]>([]);

  const actions = computed(() => boardState.value?.actions ?? { message: "", options: [] });

  function addAlert(message: string) {
    alerts.value.push({
      id: crypto.randomUUID(),
      message,
    });
  }

  function removeAlert(id: string) {
    alerts.value = alerts.value.filter((alert) => alert.id !== id);
  }

  function clearAlerts() {
    alerts.value = [];
  }

  return {
    actions,
    addAlert,
    alerts,
    clearAlerts,
    removeAlert,
  };
}
