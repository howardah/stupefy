import type { MaybeRefOrGetter } from "vue";

type RealtimeRoomStatus = "connected" | "disabled" | "idle";

export function useRealtimeRoom(room: MaybeRefOrGetter<string>) {
  const roomName = computed(() => toValue(room));
  const status = ref<RealtimeRoomStatus>("disabled");

  function connect() {
    if (!roomName.value) return;
    status.value = "idle";
  }

  function disconnect() {
    status.value = "disabled";
  }

  function sendStateUpdate() {
    return false;
  }

  return {
    connect,
    disconnect,
    roomName,
    sendStateUpdate,
    status,
  };
}
