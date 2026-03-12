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
  console.error("[welcome] Lobby request failed:", message, error);
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
    console.info("[welcome] Creating room", payload);
    const result = await api.createRoom(payload);
    const error = pickError(result);

    console.info("[welcome] Room created", result);
    if (error) {
      console.error("[welcome] Room creation error", error);
      presentError(error);
      return;
    }

    const room = result[0];
    if (!room || !("roomName" in room)) {
      console.error("[welcome] Room creation failed", result);
      presentError("This room already exists and is still active.");
      return;
    }

    console.info(
      "[welcome] Routing to new room",
      `/waiting-room?room=${room.roomName}&id=${room.players[0]?.id}&key=${room.password || ""}`,
    );
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

async function join(payload: { player: string; pw?: string; room: string }) {
  submitError.value = "";

  if (!payload.player || !payload.room) {
    presentError("Player name and room name are required.");
    return;
  }

  isSubmitting.value = true;

  try {
    console.info("[welcome] Joining room", payload);
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
</script>

<template>
  <div class="stu-shell">
    <AppHeader />
    <WelcomePanel :busy="isSubmitting" :error-message="submitError" @create="create" @join="join" />
  </div>
</template>
