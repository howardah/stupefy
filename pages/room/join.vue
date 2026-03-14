<script setup lang="ts">
import { FetchError } from "ofetch";
import type { OpenWaitingRoomSummary } from "~/utils/types";

const toast = useToast();
const router = useRouter();
const api = useDatabaseApi();
const formPanel = ref<{ setRoom: (room: string) => void } | null>(null);

const isSubmitting = ref(false);
const isRefreshingRooms = ref(false);
const submitError = ref("");
const openRooms = ref<OpenWaitingRoomSummary[]>([]);
const openRoomsError = ref("");

function pickError(result: unknown) {
  return Array.isArray(result) && result[0] && "error" in result[0]
    ? String(result[0].error)
    : null;
}

function messageFromThrownError(error: unknown, fallback: string): string {
  if (error instanceof FetchError) {
    const responseMessage =
      typeof error.data === "object" &&
      error.data !== null &&
      "statusMessage" in error.data &&
      typeof error.data.statusMessage === "string"
        ? error.data.statusMessage
        : undefined;

    return responseMessage || error.statusMessage || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

function presentError(message: string, error?: unknown) {
  submitError.value = message;
  console.error("[room/join] Room join failed:", message, error);
  toast.add({ color: "error", title: message });
}

async function refreshOpenRooms() {
  isRefreshingRooms.value = true;
  openRoomsError.value = "";

  try {
    openRooms.value = await api.getOpenRooms();
  } catch (error) {
    openRooms.value = [];
    openRoomsError.value = messageFromThrownError(
      error,
      "Unable to load open rooms right now."
    );
    console.error("[room/join] Failed to load open rooms.", error);
  } finally {
    isRefreshingRooms.value = false;
  }
}

function selectOpenRoom(roomName: string) {
  formPanel.value?.setRoom(roomName);
  submitError.value = "";
}

async function join(payload: { player: string; pw?: string; room: string }) {
  submitError.value = "";

  if (!payload.player || !payload.room) {
    presentError("Player name and room name are required.");
    return;
  }

  isSubmitting.value = true;

  try {
    console.info("[room/join] Joining room", {
      hasPassword: Boolean(payload.pw),
      player: payload.player,
      room: payload.room,
    });
    const result = await api.joinRoom(payload);
    const error = pickError(result);

    if (error) {
      presentError(error);
      return;
    }

    const room = result[0];
    if (!room || !("roomName" in room)) {
      presentError("This room could not be joined.");
      return;
    }

    const lastPlayer = room.players[room.players.length - 1];
    await router.push({
      path: "/waiting-room",
      query: {
        id: lastPlayer?.id,
        key: room.password || "",
        room: room.roomName,
      },
    });
  } catch (error) {
    presentError(messageFromThrownError(error, "Unable to join the room right now."), error);
  } finally {
    isSubmitting.value = false;
  }
}

await refreshOpenRooms();
</script>

<template>
  <div class="stu-shell">
    <AppHeader />
    <div class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <RoomFormPanel
        ref="formPanel"
        button-color="secondary"
        button-label="Join Room"
        description="Enter a room name and password, or choose an open room from the list."
        :busy="isSubmitting"
        :error-message="submitError"
        heading="Join Room"
        player-placeholder="Luna"
        room-placeholder="Room name"
        submit-icon="i-lucide-door-open"
        submit-mode="join"
        @submit="join"
      />
      <OpenRoomListPanel
        :is-refreshing="isRefreshingRooms"
        :load-error="openRoomsError"
        :rooms="openRooms"
        @pick="selectOpenRoom"
        @refresh="refreshOpenRooms"
      />
    </div>
  </div>
</template>
