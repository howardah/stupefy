<script setup lang="ts">
import { FetchError } from "ofetch";

const toast = useToast();
const router = useRouter();
const api = useDatabaseApi();

const isSubmitting = ref(false);
const submitError = ref("");

function pickError(result: unknown) {
  return Array.isArray(result) && result[0] && "error" in result[0]
    ? String(result[0].error)
    : null;
}

function presentError(message: string, error?: unknown) {
  submitError.value = message;
  console.error("[room/create] Room creation failed:", message, error);
  toast.add({ color: "error", title: message });
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

async function create(payload: { player: string; pw?: string; room: string }) {
  submitError.value = "";

  if (!payload.player || !payload.room) {
    presentError("Player name and room name are required.");
    return;
  }

  isSubmitting.value = true;

  try {
    console.info("[room/create] Creating room", {
      hasPassword: Boolean(payload.pw),
      player: payload.player,
      room: payload.room,
    });
    const result = await api.createRoom(payload);
    const error = pickError(result);

    if (error) {
      presentError(error);
      return;
    }

    const room = result[0];
    if (!room || !("roomName" in room)) {
      presentError("This room already exists and is still active.");
      return;
    }

    await router.push({
      path: "/waiting-room",
      query: {
        id: room.players[0]?.id,
        key: room.password || "",
        room: room.roomName,
      },
    });
  } catch (error) {
    presentError(messageFromThrownError(error, "Unable to create the room right now."), error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="stu-shell">
    <AppHeader />
    <RoomFormPanel
      button-color="primary"
      button-label="Create Room"
      description="Set up a room for your group. Add a password if you want to keep it private."
      :busy="isSubmitting"
      :error-message="submitError"
      heading="Create Room"
      player-placeholder="Moony"
      room-placeholder="Order of the Phoenix"
      submit-icon="i-lucide-wand-sparkles"
      submit-mode="create"
      @submit="create"
    />
  </div>
</template>
