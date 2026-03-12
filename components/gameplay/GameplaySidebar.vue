<script setup lang="ts">
import type { BoardViewState, PlayerState } from "~/utils/types";
import { currentRoleCardClass } from "~/utils/gameplay/board-ui";

const props = defineProps<{
  boardState: BoardViewState;
  canEndTurn: boolean;
  currentPlayer: PlayerState | null;
  nextTurn: number | null;
  players: PlayerState[];
  roomName: string;
}>();

const emit = defineEmits<{
  endTurn: [];
  resetBoard: [];
  toggleCards: [];
}>();

const roleClass = computed(() => currentRoleCardClass(props.boardState));
</script>

<template>
  <UCard class="stu-panel sticky top-6 rounded-[2rem] border-0">
    <template #header>
      <div class="space-y-1">
        <div class="text-xs uppercase tracking-[0.2em] text-[rgba(33,22,15,0.55)]">Room</div>
        <h3 class="text-xl font-semibold">{{ roomName }}</h3>
      </div>
    </template>

    <div class="space-y-5">
      <div class="space-y-2">
        <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.55)]">Turn order</div>
        <div class="space-y-2">
          <div
            v-for="player in players"
            :key="player.id"
            class="flex items-center justify-between rounded-2xl px-3 py-2"
            :class="player.id === boardState.turn ? 'bg-[rgba(180,83,9,0.12)]' : 'bg-[rgba(255,251,245,0.55)]'"
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

      <div class="grid gap-3">
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
          :label="boardState.showCards ? `Hide other players' hands` : 'Show all hands'"
          block
          @click="emit('toggleCards')"
        />
        <UButton color="secondary" variant="subtle" icon="i-lucide-rotate-ccw" label="Reset this view" block @click="emit('resetBoard')" />
      </div>

      <div class="rounded-[1.6rem] bg-[rgba(255,251,245,0.55)] p-4 text-sm text-[rgba(33,22,15,0.72)]">
        <div>Current player: {{ currentPlayer?.name || "Unknown" }}</div>
        <div>Phase: {{ boardState.turnCycle.phase }}</div>
        <div>Selected action: {{ boardState.turnCycle.action || "None" }}</div>
        <div>Next turn: {{ nextTurn ?? "Unknown" }}</div>
      </div>

      <div
        class="rounded-[1.6rem] border border-[rgba(82,57,29,0.12)] bg-[rgba(255,248,237,0.65)] p-4 text-sm"
        :class="roleClass ? 'text-[rgba(33,22,15,0.78)]' : 'text-[rgba(33,22,15,0.6)]'"
      >
        Use this panel to track the round and keep the board in sync if anything looks out of date.
      </div>
    </div>
  </UCard>
</template>
