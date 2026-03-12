<script setup lang="ts">
import type { PlayQuery } from "~/utils/types";
import { normalizeRoomKey } from "~/utils/room";

definePageMeta({
  middleware: "play-query",
});

const route = useRoute();
const api = useDatabaseApi();

const roomName = computed(() => String(route.query.room || ""));
const playerId = computed(() => Number(route.query.id || 0));

const playQuery = computed<PlayQuery>(() => ({
  id: playerId.value,
  key: route.query.key ? String(route.query.key) : undefined,
  room: roomName.value,
}));

const {
  data: roomState,
  error,
  status,
} = await useAsyncData("game-room-state", () =>
  api.getGameRoom({ room: normalizeRoomKey(roomName.value) })
);

const { boardState, cardCount, currentRoom, fixtureBoardState } = useRoomState({
  playQuery,
  roomState,
});
const { actions, alerts } = useBoardActions(boardState);
const { currentPlayer, nextTurn, resetPreview, setupPreview } = useTurnCycle(boardState);
const { actionTargets, availableTargets } = useCardTargets(boardState);
const { currentEvent, systemResolution } = useCardResolution(boardState);
const realtimeRoom = useRealtimeRoom(roomName);
</script>

<template>
  <div class="stu-shell">
    <AppHeader />
    <UCard class="stu-panel rounded-[2rem] border-0">
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-semibold">Gameplay Loader</h2>
            <p class="text-sm text-[rgba(33,22,15,0.65)]">
              This page now follows the recovered React `App.js` load path and bootstraps the
              initial board state from the persisted game room.
            </p>
          </div>
          <UButton to="/welcome" color="neutral" variant="ghost" label="Back to lobby" />
        </div>
      </template>

      <div v-if="status === 'pending'" class="rounded-3xl bg-white/60 p-6 text-lg">
        Loading room state...
      </div>

      <div v-else-if="error" class="rounded-3xl bg-red-50 p-6 text-red-700">
        Error loading room: {{ error.message }}
      </div>

      <div v-else-if="!currentRoom" class="rounded-3xl bg-white/60 p-6 text-lg">
        This room doesn’t exist.
      </div>

      <div v-else class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div class="space-y-6">
          <div class="rounded-3xl bg-white/60 p-5">
            <div class="mb-3 text-xs uppercase tracking-[0.2em] text-[rgba(33,22,15,0.55)]">
              Query
            </div>
            <div class="space-y-2 text-sm">
              <div>Room: {{ playQuery.room }}</div>
              <div>Room Key: {{ normalizeRoomKey(playQuery.room) }}</div>
              <div>Player ID: {{ playQuery.id }}</div>
            </div>
          </div>

          <div class="rounded-3xl bg-white/60 p-5">
            <div class="mb-3 text-xs uppercase tracking-[0.2em] text-[rgba(33,22,15,0.55)]">
              Bootstrapped Board State
            </div>
            <div class="space-y-2 text-sm">
              <div>Players in order: {{ boardState?.players.length || 0 }}</div>
              <div>Turn: {{ boardState?.turn ?? "unknown" }}</div>
              <div>Phase: {{ boardState?.turnCycle.phase ?? "unknown" }}</div>
              <div>Popup message: {{ actions.message || "none" }}</div>
              <div>Dead players: {{ boardState?.deadPlayers.length || 0 }}</div>
              <div>
                Card count:
                {{ cardCount ? `${cardCount.length} total / ${cardCount.duplicates} duplicates` : "unknown" }}
              </div>
            </div>
          </div>

          <div class="rounded-3xl bg-white/60 p-5">
            <div class="mb-3 text-xs uppercase tracking-[0.2em] text-[rgba(33,22,15,0.55)]">
              Turn Cycle Preview
            </div>
            <div class="space-y-2 text-sm">
              <div>Current player: {{ currentPlayer?.name || "unknown" }}</div>
              <div>Next turn: {{ nextTurn ?? "unknown" }}</div>
              <div>Available targets: {{ availableTargets.join(", ") || "none" }}</div>
              <div>Action targets: {{ actionTargets.join(", ") || "none" }}</div>
              <div>Next phase preview: {{ setupPreview?.turnCycle.phase || "unknown" }}</div>
              <div>Reset phase preview: {{ resetPreview?.phase || "unknown" }}</div>
            </div>
          </div>

          <div class="rounded-3xl bg-white/60 p-5">
            <div class="mb-3 text-xs uppercase tracking-[0.2em] text-[rgba(33,22,15,0.55)]">
              Event Resolution
            </div>
            <div class="space-y-2 text-sm">
              <div>Current event type: {{ currentEvent?.cardType || "none" }}</div>
              <div>System resolution: {{ systemResolution ? systemResolution.popup?.message : "none" }}</div>
              <div>Realtime status: {{ realtimeRoom.status }}</div>
              <div>Fixture players: {{ fixtureBoardState.players.length }}</div>
              <div>Alerts queued: {{ alerts.length }}</div>
            </div>
          </div>

          <div class="rounded-3xl bg-white/60 p-5">
            <div class="mb-3 text-xs uppercase tracking-[0.2em] text-[rgba(33,22,15,0.55)]">
              Turn Order
            </div>
            <div class="space-y-2 text-sm">
              <div
                v-for="player in boardState?.players || []"
                :key="player.id"
                class="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2"
              >
                <span>{{ player.name }}</span>
                <span class="text-[rgba(33,22,15,0.5)]">
                  {{ player.id === playQuery.id ? "You" : player.role || "unknown" }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <UTextarea
          :model-value="JSON.stringify({ room: currentRoom, boardState, cardCount }, null, 2)"
          :rows="28"
          readonly
        />
      </div>
    </UCard>
  </div>
</template>
