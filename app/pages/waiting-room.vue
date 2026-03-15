<script setup lang="ts">
import type { WaitingPlayer, WaitingRoomApiResponse, WaitingRoomState } from "@shared/utils/types";
import { normalizeRoomKey } from "@shared/utils/room";
import { useRealtimeWebSocket } from "~/composables/gameplay/useRealtimeWebSocket";

definePageMeta({
  middleware: "waiting-room-query",
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const api = useDatabaseApi();

const roomName = computed(() => String(route.query.room || ""));
const roomKey = computed(() => String(route.query.key || ""));
const currentPlayerId = computed(() => Number(route.query.id || 0));
const sessionId = useState("waiting-room-session-id", () => crypto.randomUUID());

const roomState = ref<WaitingRoomState | null>(null);
const message = ref("");
const isRefreshing = ref(false);
const isStarting = ref(false);
const isUpdatingReady = ref(false);
const pageError = ref("");
const hasLoaded = ref(false);

const websocket = useRealtimeWebSocket({
  autoConnect: true,
  onRoomUpdated(room, source) {
    if (room === roomKey.value && hasLoaded.value) {
      void refreshRoom();
    }
  },
});

watch(
  roomKey,
  (key) => {
    if (key) websocket.subscribe(key);
  },
  { immediate: true },
);

const allPlayers = computed<WaitingPlayer[]>(() => roomState.value?.players || []);

const connectedPlayers = computed<WaitingPlayer[]>(() => {
  const currentRoom = roomState.value;
  if (!currentRoom) return [];

  const activeIds = new Set(Object.values(currentRoom.active || {}).map((value) => Number(value)));

  return currentRoom.players.filter((player) => activeIds.has(Number(player.id)));
});

const readyState = computed<Record<string, boolean>>(() => roomState.value?.ready || {});
const activePlayerIds = computed(() => connectedPlayers.value.map((player) => Number(player.id)));
const currentPlayerReady = computed(() => readyState.value[String(currentPlayerId.value)] === true);
const everyoneReady = computed(
  () =>
    allPlayers.value.length > 0 &&
    allPlayers.value.every((player) => readyState.value[String(player.id)] === true),
);

function presentError(messageText: string, error?: unknown) {
  pageError.value = messageText;
  if (error) {
    console.error("[waiting-room]", messageText, error);
  } else {
    console.error("[waiting-room]", messageText);
  }
  toast.add({ color: "error", title: messageText });
}

function handleRoomError(result: WaitingRoomApiResponse) {
  if (Array.isArray(result) && result[0] && "error" in result[0]) {
    presentError(String(result[0].error));
    return true;
  }
  return false;
}

async function heartbeat() {
  await api.updateActive({
    room: roomName.value,
    playerId: currentPlayerId.value,
    sessionId: sessionId.value,
  });
}

async function launchGameIfReady() {
  if (!everyoneReady.value || isStarting.value) return;

  isStarting.value = true;

  try {
    await api.startGame({
      room: normalizeRoomKey(roomName.value),
    });

    await router.push({
      path: "/play",
      query: route.query,
    });
  } catch (error) {
    presentError("Unable to launch the game for this room.", error);
  } finally {
    isStarting.value = false;
  }
}

async function refreshRoom() {
  isRefreshing.value = true;
  pageError.value = "";

  try {
    const result = await api.getWaitingRoom({
      id: currentPlayerId.value,
      key: roomKey.value,
      room: roomName.value,
    });

    if (handleRoomError(result)) {
      hasLoaded.value = true;
      return;
    }

    const room = result[0];
    if (!room || !("players" in room)) {
      presentError("This room could not be loaded.");
      hasLoaded.value = true;
      return;
    }

    roomState.value = room;
    hasLoaded.value = true;
    await heartbeat();
  } catch (error) {
    presentError("Unable to refresh the waiting room.", error);
  } finally {
    isRefreshing.value = false;
  }
}

async function sendChat() {
  if (!message.value.trim()) return;

  const newChat = {
    player: currentPlayerId.value,
    text: message.value.trim(),
    time: Date.now(),
  };

  message.value = "";

  try {
    const result = await api.addChat({
      room: roomName.value,
      newChat,
    });

    if (!result) {
      presentError("Unable to send the chat message.");
      return;
    }

    await refreshRoom();
  } catch (error) {
    presentError("Unable to send the chat message.", error);
  }
}

async function toggleReady() {
  isUpdatingReady.value = true;

  try {
    const result = await api.setReady({
      room: roomName.value,
      playerId: currentPlayerId.value,
      ready: !currentPlayerReady.value,
    });

    if (handleRoomError(result)) {
      return;
    }

    await refreshRoom();
  } catch (error) {
    presentError("Unable to update your ready status.", error);
  } finally {
    isUpdatingReady.value = false;
  }
}

await refreshRoom();

watch(
  everyoneReady,
  (ready) => {
    if (!ready || !hasLoaded.value) return;
    void launchGameIfReady();
  },
  { immediate: true },
);

let refreshTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  refreshTimer = setInterval(() => {
    void refreshRoom();
  }, 15_000);
});

onBeforeUnmount(async () => {
  if (refreshTimer) clearInterval(refreshTimer);
  websocket.unsubscribe();
  websocket.disconnect();
  await api.removeActive({
    room: roomName.value,
    sessionId: sessionId.value,
  });
});
</script>

<template>
  <div class="stu-shell">
    <AppHeader />
    <UAlert
      v-if="!roomName || !currentPlayerId"
      color="error"
      variant="soft"
      title="This room link is incomplete. Go back to the lobby and join again."
      class="mb-6"
    />
    <div
      v-else-if="!hasLoaded && isRefreshing"
      class="stu-panel mb-6 rounded-[2rem] px-6 py-8 text-center text-lg"
    >
      Loading room...
    </div>
    <WaitingRoomPanel
      :active-player-ids="activePlayerIds"
      :chat="roomState?.chat || []"
      :current-player-id="currentPlayerId"
      :current-player-ready="currentPlayerReady"
      :empty-message="hasLoaded ? 'No one has joined this room yet.' : 'Loading players...'"
      :error-message="pageError"
      :everyone-ready="everyoneReady"
      :is-refreshing="isRefreshing"
      :is-starting="isStarting"
      :is-updating-ready="isUpdatingReady"
      :message="message"
      :players="allPlayers"
      :ready-state="readyState"
      :room="roomName"
      @refresh="refreshRoom"
      @send="sendChat"
      @toggle-ready="toggleReady"
      @update="message = $event"
    />
  </div>
</template>
