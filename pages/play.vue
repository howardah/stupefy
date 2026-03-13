<script setup lang="ts">
import type { GameCard } from "~/utils/types";
import { useBoardController } from "~/composables/gameplay/useBoardController";
import { usePlayRoomSync } from "~/composables/gameplay/usePlayRoomSync";
import { usePlayStatusItems } from "~/composables/gameplay/usePlayStatusItems";
import { useRoomState } from "~/composables/gameplay/useRoomState";
import { useTurnCycle } from "~/composables/gameplay/useTurnCycle";
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

const { boardState: sourceBoardState, currentRoom } = useRoomState({
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
  handleApparate,
  handleCharacterClick,
  handleDeckClick,
  handleHandClick,
  handleTableClick,
  handleTableauClick,
  orderedPlayers,
  powerActions,
  removeAlert,
  resetBoard,
  toggleCards,
  usePowerAction,
  mutationNonce,
} = useBoardController(sourceBoardState);
const { currentPlayer, nextTurn } = useTurnCycle(computed(() => boardState.value));
const { realtimeRoom, reloadRoom } = usePlayRoomSync({
  api,
  boardState,
  currentRoom,
  mutationNonce,
  normalizedRoomKey,
  playerId,
  playQuery,
  roomState,
  toast,
});
const { statusItems } = usePlayStatusItems({
  availableTargets,
  boardState,
  lastSyncedAt: realtimeRoom.lastSyncedAt,
  playerId,
});

function onTableClick(card: GameCard) {
  handleTableClick(card);
}
</script>

<template>
  <div class="stu-shell !max-w-[1400px]">
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-[rgba(82,57,29,0.12)] pb-5">
      <div class="min-w-0">
        <div class="text-xs uppercase tracking-[0.22em] text-[rgba(33,22,15,0.55)]">Stupefy</div>
        <h1 class="text-3xl font-semibold sm:text-4xl">{{ roomName }}</h1>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <UBadge color="secondary" variant="subtle">Connection: {{ realtimeRoom.status }}</UBadge>
        <UButton color="neutral" variant="ghost" icon="i-lucide-refresh-cw" label="Refresh" @click="reloadRoom" />
        <UButton to="/" color="neutral" variant="soft" icon="i-lucide-arrow-left" label="Leave table" />
      </div>
    </div>

    <div v-if="status === 'pending'" class="rounded-[2rem] bg-white/60 p-8 text-lg shadow-[0_24px_80px_rgba(62,39,15,0.08)]">
      Loading game...
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
        title="Connection needs attention"
        :description="realtimeRoom.errorMessage"
      />

      <div class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[rgba(33,22,15,0.72)]">
        <span
          v-for="item in statusItems"
          :key="item"
          class="border-b border-[rgba(82,57,29,0.12)] pb-1"
        >
          {{ item }}
        </span>
      </div>

      <GameplayBoard
        :actions="actions"
        :alerts="alerts"
        :board-state="boardState"
        :can-end-turn="canEndTurn"
        :current-player="currentPlayer"
        :next-turn="nextTurn"
        :ordered-players="orderedPlayers"
        :power-actions="powerActions"
        :room-name="playQuery.room"
        :targets="availableTargets"
        @choose-action="chooseAction"
        @choose-character="chooseCharacter"
        @clear-action="clearResolutionAction"
        @click-apparate="handleApparate"
        @click-character="handleCharacterClick"
        @click-deck-pile="handleDeckClick"
        @click-hand="handleHandClick"
        @click-table="onTableClick"
        @click-tableau="handleTableauClick"
        @close-alert="removeAlert"
        @end-turn="endTurn"
        @reset-board="resetBoard"
        @toggle-cards="toggleCards"
        @use-power-action="usePowerAction"
      />
    </div>
  </div>
</template>
