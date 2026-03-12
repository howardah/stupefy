<script setup lang="ts">
import type { CharacterCard, GameCard } from "~/utils/types";
import { useBoardController } from "~/composables/gameplay/useBoardController";
import { useRealtimeRoom } from "~/composables/gameplay/useRealtimeRoom";
import { useRoomState } from "~/composables/gameplay/useRoomState";
import { useTurnCycle } from "~/composables/gameplay/useTurnCycle";
import { normalizeRoomKey } from "~/utils/room";

definePageMeta({
  middleware: "play-query",
});

const route = useRoute();
const api = useDatabaseApi();
const toast = useToast();
const realtimeRoom = useRealtimeRoom(computed(() => String(route.query.room || "")));

const roomName = computed(() => String(route.query.room || ""));
const playerId = computed(() => Number(route.query.id || 0));

const playQuery = computed(() => ({
  id: playerId.value,
  key: route.query.key ? String(route.query.key) : undefined,
  room: roomName.value,
}));

const {
  data: roomState,
  error,
  refresh,
  status,
} = await useAsyncData("game-room-state", () =>
  api.getGameRoom({ room: normalizeRoomKey(roomName.value) })
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
} = useBoardController(sourceBoardState);
const { currentPlayer, nextTurn } = useTurnCycle(computed(() => boardState.value));

const isChoosingCharacters = computed(() =>
  orderedPlayers.value.some((player) => Array.isArray(player.character))
);

async function persistCharacterSelection() {
  if (!boardState.value) return;

  await api.updateGameRoom({
    room: normalizeRoomKey(roomName.value),
    data: {
      deck: boardState.value.deck,
      events: boardState.value.events,
      players: boardState.value.players,
      turn: boardState.value.turn,
      turnCycle: boardState.value.turnCycle,
      turnOrder: boardState.value.turnOrder,
    },
  });
}

async function handleChooseCharacter(character: CharacterCard) {
  chooseCharacter(character);
  await nextTick();

  try {
    await persistCharacterSelection();
    await refresh();
  } catch (persistError) {
    console.error("[play] Failed to persist character selection.", persistError);
    toast.add({
      title: "Unable to save character choice",
      description: "Your selection could not be shared with the rest of the room.",
      color: "error",
      icon: "i-lucide-octagon-alert",
    });
  }
}

function logUnsupportedAction(action: string, index: number) {
  console.warn("[play] Action option selected before rule port:", { action, index });
  toast.add({
    title: "Action not yet available",
    description:
      "This popup came from the migrated event queue, but its card-rule handler is still pending in a later roadmap phase.",
    color: "info",
    icon: "i-lucide-hourglass",
  });
}

function onTableClick(card: GameCard) {
  handleTableClick(card);
}

let roomRefreshTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  roomRefreshTimer = setInterval(() => {
    if (isChoosingCharacters.value) {
      void refresh();
    }
  }, 3000);
});

onBeforeUnmount(() => {
  if (roomRefreshTimer) {
    clearInterval(roomRefreshTimer);
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
          Phase 6 replaces the previous diagnostics-only loader with the real Vue board container.
          Core turn selection, drawing, character choice, alerts, and end-turn flow are now local
          and typed. Full spell/event resolution still moves into later phases.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <UBadge color="secondary" variant="subtle">Realtime: {{ realtimeRoom.status }}</UBadge>
        <UBadge color="neutral" variant="subtle">
          Cards tracked:
          {{ cardCount ? `${cardCount.length} / ${cardCount.duplicates} duplicates` : "unknown" }}
        </UBadge>
        <UButton color="neutral" variant="ghost" icon="i-lucide-refresh-cw" label="Reload room" @click="refresh()" />
        <UButton to="/welcome" color="neutral" variant="soft" icon="i-lucide-arrow-left" label="Back to lobby" />
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
      <div class="grid gap-4 md:grid-cols-4">
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
          <div class="mt-2 text-sm">{{ normalizeRoomKey(roomName) }}</div>
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
        @choose-action="logUnsupportedAction"
        @choose-character="handleChooseCharacter"
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
