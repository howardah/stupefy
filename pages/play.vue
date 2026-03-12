<script setup lang="ts">
import type { FetchError } from "ofetch";
import type { GameCard, GameRoomSyncResponse, GameState } from "~/utils/types";
import { useBoardController } from "~/composables/gameplay/useBoardController";
import { useRealtimeRoom } from "~/composables/gameplay/useRealtimeRoom";
import { useRoomState } from "~/composables/gameplay/useRoomState";
import { useTurnCycle } from "~/composables/gameplay/useTurnCycle";
import { createBoardViewState } from "~/utils/gameplay/bootstrap";
import { createGameStatePatch } from "~/utils/gameplay/sync";
import { getGameplaySyncSignature } from "~/utils/gameplay/sync";
import { normalizeRoomKey } from "~/utils/room";

definePageMeta({
  middleware: "play-query",
});

const route = useRoute();
const api = useDatabaseApi();
const toast = useToast();

const roomName = computed(() => String(route.query.room || ""));
const playerId = computed(() => Number(route.query.id || 0));
const normalizedRoomKey = computed(() => normalizeRoomKey(roomName.value));

const playQuery = computed(() => ({
  id: playerId.value,
  key: route.query.key ? String(route.query.key) : undefined,
  room: roomName.value,
}));

const {
  data: roomState,
  error,
  status,
} = await useAsyncData(
  () => `game-room-state:${normalizedRoomKey.value}`,
  () => api.getGameRoom({ room: normalizedRoomKey.value }),
  {
    watch: [normalizedRoomKey],
  }
);

const { boardState: sourceBoardState, cardCount, currentRoom } = useRoomState({
  playQuery,
  roomState,
});
const {
  actions,
  alerts,
  availableTargets,
  boardState,
  canEndTurn,
  chooseAction,
  chooseCharacter,
  clearResolutionAction,
  endTurn,
  handleCharacterClick,
  handleDeckClick,
  handleHandClick,
  handleTableClick,
  handleTableauClick,
  orderedPlayers,
  removeAlert,
  resetBoard,
  toggleCards,
  mutationNonce,
} = useBoardController(sourceBoardState);
const { currentPlayer, nextTurn } = useTurnCycle(computed(() => boardState.value));
const isApplyingAuthoritativeState = ref(false);

function extractConflictRoom(error: unknown) {
  const fetchError = error as FetchError<GameRoomSyncResponse>;
  return fetchError?.data?.room ?? null;
}

async function applyAuthoritativeRoom(room: GameState | null) {
  isApplyingAuthoritativeState.value = true;
  roomState.value = room ? [room] : false;
  await nextTick();
  isApplyingAuthoritativeState.value = false;
}

function getRoomFromResponse(response: GameState[] | false): GameState | null {
  return Array.isArray(response) && response[0] ? response[0] : null;
}

function getRoomSignature(room: GameState | null) {
  if (!room || !normalizedRoomKey.value || playerId.value <= 0) {
    return null;
  }

  return getGameplaySyncSignature(
    createBoardViewState(room, {
      id: playerId.value,
      key: route.query.key ? String(route.query.key) : undefined,
      room: roomName.value,
    })
  );
}

async function fetchLatestRoom() {
  const response = await api.getGameRoom({ room: normalizedRoomKey.value });
  const nextRoom = getRoomFromResponse(response);
  const currentSignature = getRoomSignature(currentRoom.value);
  const nextSignature = getRoomSignature(nextRoom);

  if (
    nextRoom &&
    (
      !currentRoom.value ||
      currentRoom.value.last_updated !== nextRoom.last_updated ||
      currentSignature !== nextSignature
    )
  ) {
    await applyAuthoritativeRoom(nextRoom);
    return;
  }

  if (!nextRoom && currentRoom.value) {
    await applyAuthoritativeRoom(null);
  }
}

async function reloadRoom() {
  try {
    await fetchLatestRoom();
  } catch (refreshError) {
    console.error("[play] Failed to refresh the game room.", refreshError);
    toast.add({
      title: "Unable to refresh room",
      description: "The latest game state could not be loaded from the server.",
      color: "error",
      icon: "i-lucide-octagon-alert",
    });
  }
}

const realtimeRoom = useRealtimeRoom({
  enabled: computed(() => Boolean(normalizedRoomKey.value && playerId.value > 0)),
  fetchLatest: fetchLatestRoom,
  pushUpdate: api.updateGameRoom,
  room: normalizedRoomKey,
});

async function persistBoardState() {
  if (!boardState.value || !normalizedRoomKey.value) {
    return;
  }

  try {
    const response = await realtimeRoom.pushStateUpdate({
      data: createGameStatePatch(boardState.value),
      expectedLastUpdated: currentRoom.value?.last_updated,
      playerId: playerId.value,
      room: normalizedRoomKey.value,
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
      toast.add({
        title: "Room updated by another player",
        description: "Your view has been refreshed to the latest shared game state.",
        color: "warning",
        icon: "i-lucide-refresh-cw",
      });
      return;
    }

    console.error("[play] Failed to persist board state.", persistError);
    toast.add({
      title: "Unable to sync game state",
      description: "Your action was applied locally, but the shared room could not be updated.",
      color: "error",
      icon: "i-lucide-octagon-alert",
    });
  }
}

function onTableClick(card: GameCard) {
  handleTableClick(card);
}

watch(
  mutationNonce,
  (nextMutation, previousMutation) => {
    if (
      nextMutation === previousMutation ||
      nextMutation === 0 ||
      isApplyingAuthoritativeState.value
    ) {
      return;
    }

    void persistBoardState();
  }
);

onBeforeUnmount(() => {
  if (realtimeRoom.status.value !== "disabled") {
    realtimeRoom.disconnect();
  }
});
</script>

<template>
  <div class="stu-shell !max-w-[1400px]">
    <AppHeader />

    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="text-xs uppercase tracking-[0.22em] text-[rgba(33,22,15,0.55)]">Game Room</div>
        <h1 class="text-4xl font-semibold">{{ roomName }}</h1>
        <p class="mt-2 max-w-3xl text-sm text-[rgba(33,22,15,0.68)]">
          The migrated Vue board now syncs through a typed server-authoritative polling layer.
          Core turn selection, drawing, character choice, alerts, and end-turn flow are shared
          across players. Full spell and event resolution still moves into later phases.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <UBadge color="secondary" variant="subtle">Realtime: {{ realtimeRoom.status }}</UBadge>
        <UBadge color="neutral" variant="subtle">Transport: {{ realtimeRoom.transport }}</UBadge>
        <UBadge color="neutral" variant="subtle">
          Cards tracked:
          {{ cardCount ? `${cardCount.length} / ${cardCount.duplicates} duplicates` : "unknown" }}
        </UBadge>
        <UButton color="neutral" variant="ghost" icon="i-lucide-refresh-cw" label="Reload room" @click="reloadRoom" />
        <UButton to="/" color="neutral" variant="soft" icon="i-lucide-arrow-left" label="Back to lobby" />
      </div>
    </div>

    <div v-if="status === 'pending'" class="rounded-[2rem] bg-white/60 p-8 text-lg shadow-[0_24px_80px_rgba(62,39,15,0.08)]">
      Loading room state...
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      title="Unable to load this game room"
      :description="error.message"
    />

    <UAlert
      v-else-if="!currentRoom || !boardState"
      color="warning"
      variant="subtle"
      title="Room not found"
      description="The requested room could not be loaded."
    />

    <div v-else class="space-y-6">
      <UAlert
        v-if="
          realtimeRoom.errorMessage &&
          (realtimeRoom.status === 'error' || realtimeRoom.status === 'reconnecting')
        "
        color="warning"
        variant="subtle"
        title="Realtime sync needs attention"
        :description="realtimeRoom.errorMessage"
      />

      <div class="grid gap-4 md:grid-cols-5">
        <UCard class="stu-panel rounded-[1.6rem] border-0">
          <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.55)]">Player</div>
          <div class="mt-2 text-xl font-semibold">{{ playerId }}</div>
        </UCard>
        <UCard class="stu-panel rounded-[1.6rem] border-0">
          <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.55)]">Phase</div>
          <div class="mt-2 text-xl font-semibold">{{ boardState.turnCycle.phase }}</div>
        </UCard>
        <UCard class="stu-panel rounded-[1.6rem] border-0">
          <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.55)]">Targets</div>
          <div class="mt-2 text-sm">{{ availableTargets.join(", ") || "none" }}</div>
        </UCard>
        <UCard class="stu-panel rounded-[1.6rem] border-0">
          <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.55)]">Room Key</div>
          <div class="mt-2 text-sm">{{ normalizedRoomKey }}</div>
        </UCard>
        <UCard class="stu-panel rounded-[1.6rem] border-0">
          <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.55)]">Last Sync</div>
          <div class="mt-2 text-sm">
            {{ realtimeRoom.lastSyncedAt ? new Date(realtimeRoom.lastSyncedAt).toLocaleTimeString() : "pending" }}
          </div>
        </UCard>
      </div>

      <GameplayBoard
        :actions="actions"
        :alerts="alerts"
        :board-state="boardState"
        :can-end-turn="canEndTurn"
        :current-player="currentPlayer"
        :next-turn="nextTurn"
        :ordered-players="orderedPlayers"
        :room-name="playQuery.room"
        :targets="availableTargets"
        @choose-action="chooseAction"
        @choose-character="chooseCharacter"
        @clear-action="clearResolutionAction"
        @click-character="handleCharacterClick"
        @click-deck-pile="handleDeckClick"
        @click-hand="handleHandClick"
        @click-table="onTableClick"
        @click-tableau="handleTableauClick"
        @close-alert="removeAlert"
        @end-turn="endTurn"
        @reset-board="resetBoard"
        @toggle-cards="toggleCards"
      />
    </div>
  </div>
</template>
