import type { Ref } from "vue";
import type { FetchError } from "ofetch";
import type {
  BoardViewState,
  GameRoomApiResponse,
  GameRoomSyncResponse,
  GameState,
  PlayQuery,
} from "~/utils/types";
import { useRealtimeRoom } from "~/composables/gameplay/useRealtimeRoom";
import { createBoardViewState } from "~/utils/gameplay/bootstrap";
import { createGameStatePatch, getGameplaySyncSignature } from "~/utils/gameplay/sync";

interface PlayRoomSyncApi {
  getGameRoom: (payload: { room: string }) => Promise<GameRoomApiResponse>;
  updateGameRoom: (
    payload: Parameters<ReturnType<typeof useDatabaseApi>["updateGameRoom"]>[0],
  ) => Promise<GameRoomSyncResponse>;
}

interface UsePlayRoomSyncOptions {
  api: PlayRoomSyncApi;
  boardState: Ref<BoardViewState | null>;
  currentRoom: Ref<GameState | null>;
  mutationNonce: Ref<number>;
  normalizedRoomKey: Ref<string>;
  playerId: Ref<number>;
  playQuery: Ref<PlayQuery>;
  roomState: Ref<GameRoomApiResponse | null | undefined>;
  toast: ReturnType<typeof useToast>;
}

function getRoomFromResponse(response: GameRoomApiResponse): GameState | null {
  return Array.isArray(response) && response[0] ? response[0] : null;
}

function extractConflictRoom(error: unknown) {
  const fetchError = error as FetchError<GameRoomSyncResponse>;
  return fetchError?.data?.room ?? null;
}

export function usePlayRoomSync(options: UsePlayRoomSyncOptions) {
  const isApplyingAuthoritativeState = ref(false);

  async function applyAuthoritativeRoom(room: GameState | null) {
    isApplyingAuthoritativeState.value = true;
    options.roomState.value = room ? [room] : false;
    await nextTick();
    isApplyingAuthoritativeState.value = false;
  }

  function getRoomSignature(room: GameState | null) {
    if (!room || !options.normalizedRoomKey.value || options.playerId.value <= 0) {
      return null;
    }

    return getGameplaySyncSignature(createBoardViewState(room, options.playQuery.value));
  }

  async function fetchLatestRoom() {
    const response = await options.api.getGameRoom({ room: options.normalizedRoomKey.value });
    const nextRoom = getRoomFromResponse(response);
    const currentSignature = getRoomSignature(options.currentRoom.value);
    const nextSignature = getRoomSignature(nextRoom);

    if (
      nextRoom &&
      (!options.currentRoom.value ||
        options.currentRoom.value.last_updated !== nextRoom.last_updated ||
        currentSignature !== nextSignature)
    ) {
      await applyAuthoritativeRoom(nextRoom);
      return;
    }

    if (!nextRoom && options.currentRoom.value) {
      await applyAuthoritativeRoom(null);
    }
  }

  async function reloadRoom() {
    try {
      await fetchLatestRoom();
    } catch (refreshError) {
      console.error("[play] Failed to refresh the game room.", refreshError);
      options.toast.add({
        title: "Unable to refresh room",
        description: "The latest game state could not be loaded from the server.",
        color: "error",
        icon: "i-lucide-octagon-alert",
      });
    }
  }

  const realtimeRoom = useRealtimeRoom({
    enabled: computed(() => Boolean(options.normalizedRoomKey.value && options.playerId.value > 0)),
    fetchLatest: fetchLatestRoom,
    pushUpdate: options.api.updateGameRoom,
    room: options.normalizedRoomKey,
  });

  async function persistBoardState() {
    if (!options.boardState.value || !options.normalizedRoomKey.value) {
      return;
    }

    try {
      const response = await realtimeRoom.pushStateUpdate({
        data: createGameStatePatch(options.boardState.value),
        expectedLastUpdated: options.currentRoom.value?.last_updated,
        playerId: options.playerId.value,
        room: options.normalizedRoomKey.value,
        transport: "polling",
      });

      if (response?.room) {
        await applyAuthoritativeRoom(response.room);
      }
    } catch (persistError) {
      const conflictRoom = extractConflictRoom(persistError);

      if (conflictRoom) {
        console.warn("[play] Room update conflict. Applying authoritative state.", persistError);
        await applyAuthoritativeRoom(conflictRoom);
        options.toast.add({
          title: "Room updated by another player",
          description: "Your view has been refreshed to the latest shared game state.",
          color: "warning",
          icon: "i-lucide-refresh-cw",
        });
        return;
      }

      console.error("[play] Failed to persist board state.", persistError);
      options.toast.add({
        title: "Unable to sync game state",
        description: "Your action was applied locally, but the shared room could not be updated.",
        color: "error",
        icon: "i-lucide-octagon-alert",
      });
    }
  }

  watch(options.mutationNonce, (nextMutation, previousMutation) => {
    if (
      nextMutation === previousMutation ||
      nextMutation === 0 ||
      isApplyingAuthoritativeState.value
    ) {
      return;
    }

    void persistBoardState();
  });

  onBeforeUnmount(() => {
    if (realtimeRoom.status.value !== "disabled") {
      realtimeRoom.disconnect();
    }
  });

  return {
    realtimeRoom,
    reloadRoom,
  };
}
