<script setup lang="ts">
import type { WaitingPlayer, WaitingRoomState } from "~/utils/types";
const { normalizeRoomKey } = require("../utils/room") as typeof import("../utils/room");
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
const pageError = ref("");
const hasLoaded = ref(false);

const connectedPlayers = computed<WaitingPlayer[]>(() => {
  const currentRoom = roomState.value;
  if (!currentRoom) return [];

  const activeIds = new Set(
    Object.values(currentRoom.active || {}).map((value) => Number(value))
  );

  return currentRoom.players.filter((player) => activeIds.has(Number(player.id)));
});

const canStart = computed(() => !isStarting.value && connectedPlayers.value.length > 0);

function handleRoomError(result: unknown) {
  if (Array.isArray(result) && result[0] && "error" in result[0]) {
    pageError.value = String(result[0].error);
    toast.add({ color: "error", title: pageError.value });
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

async function refreshRoom() {
  isRefreshing.value = true;
  pageError.value = "";

  const result = await api.getWaitingRoom({
    id: currentPlayerId.value,
    key: roomKey.value,
    room: roomName.value,
  });

  if (handleRoomError(result)) {
    hasLoaded.value = true;
    isRefreshing.value = false;
    return;
  }

  const room = result[0];
  if (!room || !("players" in room)) {
    pageError.value = "This room could not be loaded.";
    hasLoaded.value = true;
    isRefreshing.value = false;
    return;
  }
  roomState.value = room;
  hasLoaded.value = true;
  await heartbeat();
  isRefreshing.value = false;
}

async function sendChat() {
  if (!message.value.trim()) return;

  const newChat = {
    player: currentPlayerId.value,
    text: message.value.trim(),
    time: Date.now(),
  };

  message.value = "";
  const result = await api.addChat({
    room: roomName.value,
    newChat,
  });

  if (handleRoomError(result)) return;
  await refreshRoom();
}

async function startGame() {
  if (!canStart.value) return;
  isStarting.value = true;

  await api.startGame({
    room: normalizeRoomKey(roomName.value),
    players: connectedPlayers.value.map((player) => ({
      character: [],
      hand: [],
      id: Number(player.id),
      name: player.name,
      power: [],
      tableau: [],
    })),
  });

  await router.push({
    path: "/play",
    query: route.query,
  });
  isStarting.value = false;
}

await refreshRoom();

let refreshTimer: ReturnType<typeof setInterval> | undefined;

onMounted(async () => {
  refreshTimer = setInterval(() => {
    refreshRoom();
  }, 4000);
});

onBeforeUnmount(async () => {
  if (refreshTimer) clearInterval(refreshTimer);
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
      v-if="!roomName || !roomKey || !currentPlayerId"
      color="error"
      variant="soft"
      title="Missing room information. Return to the lobby and rejoin the room."
      class="mb-6"
    />
    <div
      v-else-if="!hasLoaded && isRefreshing"
      class="stu-panel mb-6 rounded-[2rem] px-6 py-8 text-center text-lg"
    >
      Loading waiting room...
    </div>
    <WaitingRoomPanel
      :active-players="connectedPlayers"
      :can-start="canStart"
      :chat="roomState?.chat || []"
      :current-player-id="currentPlayerId"
      :empty-message="hasLoaded ? 'No connected players yet. Waiting for the room to refresh.' : 'Loading players...'"
      :error-message="pageError"
      :is-refreshing="isRefreshing"
      :message="message"
      :room="roomName"
      @refresh="refreshRoom"
      @send="sendChat"
      @start="startGame"
      @update="message = $event"
    />
  </div>
</template>
