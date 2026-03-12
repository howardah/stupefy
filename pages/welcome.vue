<script setup lang="ts">
const toast = useToast();
const router = useRouter();
const api = useDatabaseApi();

function pickError(result: unknown) {
  return Array.isArray(result) && result[0] && "error" in result[0]
    ? String(result[0].error)
    : null;
}

async function create(payload: { player: string; pw?: string; room: string }) {
  const result = await api.createRoom(payload);
  const error = pickError(result);

  if (error) {
    toast.add({ color: "error", title: error });
    return;
  }

  const room = result[0];
  if (!room || !("roomName" in room)) {
    toast.add({
      color: "error",
      title: "This room already exists and is still active.",
    });
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
}

async function join(payload: { player: string; pw?: string; room: string }) {
  const result = await api.joinRoom(payload);
  const error = pickError(result);

  if (error) {
    toast.add({ color: "error", title: error });
    return;
  }

  const room = result[0];
  if (!room || !("roomName" in room)) {
    toast.add({ color: "error", title: "This room could not be joined." });
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
}
</script>

<template>
  <div class="stu-shell">
    <AppHeader />
    <WelcomePanel @create="create" @join="join" />
  </div>
</template>
