import type { MaybeRefOrGetter } from "vue";
import type {
  GameRoomSyncRequest,
  GameRoomSyncResponse,
  RealtimeRoomStatus,
} from "~/utils/types";

interface UseRealtimeRoomOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  fetchLatest: () => Promise<void>;
  pollIntervalMs?: number;
  pushUpdate: (payload: GameRoomSyncRequest) => Promise<GameRoomSyncResponse>;
  room: MaybeRefOrGetter<string>;
}

const BASE_RETRY_DELAY_MS = 1500;
const MAX_RETRY_DELAY_MS = 12000;

function asErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown realtime sync failure.";
}

export function useRealtimeRoom(options: UseRealtimeRoomOptions) {
  const roomName = computed(() => toValue(options.room).trim());
  const enabled = computed(() =>
    roomName.value ? Boolean(toValue(options.enabled) ?? true) : false
  );
  const status = ref<RealtimeRoomStatus>("disabled");
  const errorMessage = ref<string | null>(null);
  const lastSyncedAt = ref<number | null>(null);
  const transport = ref<"polling">("polling");

  const pollIntervalMs = options.pollIntervalMs ?? 3000;
  const retryDelayMs = ref(BASE_RETRY_DELAY_MS);

  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  function clearTimers() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }

    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = undefined;
    }
  }

  function markSynced() {
    errorMessage.value = null;
    lastSyncedAt.value = Date.now();
    retryDelayMs.value = BASE_RETRY_DELAY_MS;
    status.value = "connected";
  }

  function scheduleRetry() {
    if (!enabled.value || retryTimer) {
      return;
    }

    status.value = "reconnecting";
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      void pullLatest("retry");
    }, retryDelayMs.value);
    retryDelayMs.value = Math.min(retryDelayMs.value * 2, MAX_RETRY_DELAY_MS);
  }

  async function pullLatest(reason: "connect" | "manual" | "poll" | "retry" = "poll") {
    if (!enabled.value) {
      return;
    }

    if (reason === "retry") {
      status.value = "reconnecting";
    } else if (reason !== "poll" || status.value !== "connected") {
      status.value = "syncing";
    }

    try {
      await options.fetchLatest();
      markSynced();
    } catch (error) {
      errorMessage.value = asErrorMessage(error);
      status.value = "error";
      scheduleRetry();
      throw error;
    }
  }

  async function pushStateUpdate(payload: GameRoomSyncRequest) {
    if (!enabled.value) {
      return null;
    }

    status.value = "syncing";

    try {
      const response = await options.pushUpdate(payload);
      transport.value = response.transport;
      markSynced();
      return response;
    } catch (error) {
      errorMessage.value = asErrorMessage(error);
      status.value = "error";
      scheduleRetry();
      throw error;
    }
  }

  function startPolling() {
    if (!enabled.value || pollTimer) {
      return;
    }

    status.value = "idle";
    pollTimer = setInterval(() => {
      void pullLatest("poll");
    }, pollIntervalMs);
  }

  function connect() {
    if (!enabled.value) {
      status.value = "disabled";
      errorMessage.value = null;
      clearTimers();
      return;
    }

    errorMessage.value = null;
    startPolling();
    void pullLatest("connect");
  }

  function disconnect() {
    clearTimers();
    errorMessage.value = null;
    status.value = enabled.value ? "idle" : "disabled";
  }

  if (import.meta.client) {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void pullLatest("manual");
      }
    };

    const onOnline = () => {
      void pullLatest("manual");
    };

    onMounted(() => {
      document.addEventListener("visibilitychange", onVisibilityChange);
      window.addEventListener("online", onOnline);
    });

    onBeforeUnmount(() => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
    });
  }

  if (import.meta.client) {
    watch(
      enabled,
      (nextEnabled) => {
        if (nextEnabled) {
          connect();
          return;
        }

        disconnect();
      },
      { immediate: true }
    );
  }

  return {
    connect,
    disconnect,
    errorMessage,
    lastSyncedAt,
    pullLatest,
    pushStateUpdate,
    roomName,
    status,
    transport,
  };
}
