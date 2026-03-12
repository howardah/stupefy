<script setup lang="ts">
const toast = useToast();
const router = useRouter();
const api = useDatabaseApi();
const isSubmitting = ref(false);

function pickError(result: unknown) {
  return Array.isArray(result) && result[0] && "error" in result[0]
    ? String(result[0].error)
    : null;
}

async function create(payload: { player: string; pw?: string; room: string }) {
  if (!payload.player || !payload.room) {
    toast.add({ color: "error", title: "Player name and room name are required." });
    return;
  }

  isSubmitting.value = true;
  const result = await api.createRoom(payload);
  const error = pickError(result);

  if (error) {
    toast.add({ color: "error", title: error });
    isSubmitting.value = false;
    return;
  }

  const room = result[0];
  if (!room || !("roomName" in room)) {
    toast.add({
      color: "error",
      title: "This room already exists and is still active.",
    });
    isSubmitting.value = false;
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
  isSubmitting.value = false;
}

async function join(payload: { player: string; pw?: string; room: string }) {
  if (!payload.player || !payload.room) {
    toast.add({ color: "error", title: "Player name and room name are required." });
    return;
  }

  isSubmitting.value = true;
  const result = await api.joinRoom(payload);
  const error = pickError(result);

  if (error) {
    toast.add({ color: "error", title: error });
    isSubmitting.value = false;
    return;
  }

  const room = result[0];
  if (!room || !("roomName" in room)) {
    toast.add({ color: "error", title: "This room could not be joined." });
    isSubmitting.value = false;
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
  isSubmitting.value = false;
}
</script>

<template>
  <div class="stu-shell">
    <AppHeader />
    <WelcomePanel :busy="isSubmitting" @create="create" @join="join" />
  </div>
</template>
