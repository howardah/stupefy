import type { BoardAlert } from "~/utils/types";

function useBoardAlerts() {
  const toast = useToast();
  const alerts = ref<BoardAlert[]>([]);

  function pushAlert(message: string, tone: BoardAlert["tone"] = "warning") {
    const alert = {
      id: crypto.randomUUID(),
      message,
      tone,
    } satisfies BoardAlert;

    alerts.value.push(alert);
    console.warn("[play] Board interaction warning:", message);
    toast.add({
      title: tone === "error" ? "Board error" : "Board update",
      description: message,
      color: tone === "error" ? "error" : tone === "info" ? "info" : "warning",
      icon: tone === "error" ? "i-lucide-octagon-alert" : "i-lucide-sparkles",
    });
  }

  function removeAlert(id: string) {
    alerts.value = alerts.value.filter((alert) => alert.id !== id);
  }

  function clearAlerts() {
    alerts.value = [];
  }

  return {
    alerts,
    clearAlerts,
    pushAlert,
    removeAlert,
  };
}

export { useBoardAlerts };
