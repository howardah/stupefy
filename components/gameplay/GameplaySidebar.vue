<script setup lang="ts">
import type { BoardViewState, PlayerState } from "~/utils/types";

const props = defineProps<{
  boardState: BoardViewState;
  canEndTurn: boolean;
  currentPlayer: PlayerState | null;
  nextTurn: number | null;
  players: PlayerState[];
  powerActions: Array<{ id: string; label: string }>;
  roomName: string;
}>();

const emit = defineEmits<{
  endTurn: [];
  resetBoard: [];
  toggleCards: [];
  usePowerAction: [id: string];
}>();
</script>

<template>
  <UCard class="stu-panel rounded-[2rem] border-0">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-xs uppercase tracking-[0.2em] text-[rgba(33,22,15,0.55)]">
            Current turn
          </div>
          <h3 class="text-xl font-semibold">{{ currentPlayer?.name || roomName }}</h3>
        </div>
        <div class="text-sm text-[rgba(33,22,15,0.68)]">Next: {{ nextTurn ?? "Unknown" }}</div>
      </div>
    </template>

    <div class="space-y-4">
      <div class="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div class="space-y-2">
          <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.55)]">
            Turn order
          </div>
          <div class="space-y-2">
            <div
              v-for="player in players"
              :key="player.id"
              class="flex items-center justify-between rounded-2xl px-3 py-2"
              :class="
                player.id === boardState.turn
                  ? 'bg-[rgba(180,83,9,0.12)]'
                  : 'bg-[rgba(255,251,245,0.55)]'
              "
            >
              <span>{{ player.name }}</span>
              <span class="text-xs uppercase tracking-[0.14em] text-[rgba(33,22,15,0.55)]">
                <template v-if="boardState.deadPlayers.includes(player.id)">dead</template>
                <template v-else-if="player.id === boardState.turn">active</template>
                <template v-else>{{ player.role || "role" }}</template>
              </span>
            </div>
          </div>
        </div>

        <div
          class="rounded-[1.6rem] bg-[rgba(255,251,245,0.55)] p-4 text-sm text-[rgba(33,22,15,0.72)]"
        >
          <div>Phase: {{ boardState.turnCycle.phase }}</div>
          <div>Selected: {{ boardState.turnCycle.action || "None" }}</div>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <UButton
          color="primary"
          :disabled="!canEndTurn"
          icon="i-lucide-skip-forward"
          label="End turn"
          block
          @click="emit('endTurn')"
        />
        <UButton
          color="neutral"
          variant="soft"
          :icon="boardState.showCards ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          :label="boardState.showCards ? `Hide hands` : 'Show hands'"
          block
          @click="emit('toggleCards')"
        />
        <UButton
          color="secondary"
          variant="subtle"
          icon="i-lucide-rotate-ccw"
          label="Reset view"
          block
          @click="emit('resetBoard')"
        />
      </div>

      <div v-if="powerActions.length > 0" class="space-y-2">
        <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.55)]">
          Character powers
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <UButton
            v-for="action in powerActions"
            :key="action.id"
            color="secondary"
            variant="soft"
            class="justify-center"
            @click="emit('usePowerAction', action.id)"
          >
            {{ action.label }}
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>
