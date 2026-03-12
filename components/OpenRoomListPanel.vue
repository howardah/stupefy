<script setup lang="ts">
import type { OpenWaitingRoomSummary } from "~/utils/types";

defineProps<{
  isRefreshing?: boolean;
  loadError?: string;
  rooms: OpenWaitingRoomSummary[];
}>();

const emit = defineEmits<{
  pick: [roomName: string];
  refresh: [];
}>();

function formatUpdatedAt(updatedAt: number): string {
  if (!updatedAt) return "Recently active";

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(updatedAt);
}
</script>

<template>
  <UCard class="stu-panel rounded-[2rem] border-0">
    <template #header>
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold uppercase tracking-[0.2em]">Open Rooms</h2>
          <p class="mt-2 text-sm text-[rgba(33,22,15,0.65)]">
            These rooms have no password and the game has not started yet.
          </p>
        </div>
        <UButton
          color="neutral"
          variant="soft"
          icon="i-lucide-refresh-cw"
          :loading="isRefreshing"
          label="Refresh"
          @click="emit('refresh')"
        />
      </div>
    </template>

    <UAlert
      v-if="loadError"
      color="error"
      variant="soft"
      :title="loadError"
      class="mb-4"
    />

    <div v-if="rooms.length" class="grid gap-3">
      <button
        v-for="room in rooms"
        :key="room.roomName"
        type="button"
        class="rounded-3xl border border-[rgba(33,22,15,0.08)] bg-white/70 px-4 py-4 text-left transition hover:border-[rgba(33,22,15,0.18)] hover:bg-white"
        @click="emit('pick', room.roomName)"
      >
        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="text-lg font-semibold text-default">{{ room.roomName }}</div>
            <div class="mt-1 text-sm text-[rgba(33,22,15,0.6)]">
              {{ room.playerCount }} players, {{ room.activeCount }} active
            </div>
          </div>
          <div class="text-right text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.45)]">
            {{ formatUpdatedAt(room.updatedAt) }}
          </div>
        </div>
      </button>
    </div>

    <div v-else class="rounded-3xl bg-white/60 px-5 py-6 text-sm text-[rgba(33,22,15,0.65)]">
      No open rooms are available right now. You can still join a private room manually if you know its name.
    </div>
  </UCard>
</template>
