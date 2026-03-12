<script setup lang="ts">
import type { WaitingPlayer, WaitingRoomState } from "~/utils/types";
const camelCase = require("lodash/camelCase") as (value: string) => string;

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

const connectedPlayers = computed<WaitingPlayer[]>(() => {
  const currentRoom = roomState.value;
  if (!currentRoom) return [];

  const activeIds = new Set(
    Object.values(currentRoom.active || {}).map((value) => Number(value))
  );

  return currentRoom.players.filter((player) => activeIds.has(Number(player.id)));
});

function handleRoomError(result: unknown) {
  if (Array.isArray(result) && result[0] && "error" in result[0]) {
    toast.add({ color: "error", title: String(result[0].error) });
    return true;
  }
  return false;
}

async function refreshRoom() {
  const result = await api.getWaitingRoom({
    id: currentPlayerId.value,
    key: roomKey.value,
    room: roomName.value,
  });

  if (handleRoomError(result)) return;

  const room = result[0];
  if (!room || !("players" in room)) return;
  roomState.value = room;
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
  if (!connectedPlayers.value.length) return;

  await api.startGame({
    room: camelCase(roomName.value),
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
}

await refreshRoom();

let refreshTimer: ReturnType<typeof setInterval> | undefined;

onMounted(async () => {
  if (roomState.value) {
    await api.updateActive({
      room: roomName.value,
      active: {
        ...(roomState.value.active || {}),
        [sessionId.value]: currentPlayerId.value,
      },
    });
  }

  refreshTimer = setInterval(() => {
    refreshRoom();
  }, 4000);
});

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<template>
  <div class="stu-shell">
    <AppHeader />
    <WaitingRoomPanel
      :active-players="connectedPlayers"
      :can-start="connectedPlayers.length > 0"
      :chat="roomState?.chat || []"
      :current-player-id="currentPlayerId"
      :message="message"
      :room="roomName"
      @refresh="refreshRoom"
      @send="sendChat"
      @start="startGame"
      @update="message = $event"
    />
  </div>
</template>
