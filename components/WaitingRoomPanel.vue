<script setup lang="ts">
import type { WaitingChatMessage, WaitingPlayer } from "~/utils/types";

const props = defineProps<{
  activePlayerIds: number[];
  chat: WaitingChatMessage[];
  currentPlayerId: number;
  currentPlayerReady: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  everyoneReady: boolean;
  isRefreshing: boolean;
  isStarting: boolean;
  isUpdatingReady: boolean;
  message: string;
  players: WaitingPlayer[];
  readyState: Record<string, boolean>;
  room: string;
}>();

const emit = defineEmits<{
  refresh: [];
  send: [];
  toggleReady: [];
  update: [value: string];
}>();

function playerName(message: WaitingChatMessage) {
  if (message.player === 100) return "system";
  const match = props.players.find((player) => player.id === message.player);
  return match?.name || "unknown";
}

function isActive(playerId: number) {
  return props.activePlayerIds.includes(playerId);
}

function isReady(playerId: number) {
  return props.readyState[String(playerId)] === true;
}

const readyCount = computed(() => props.players.filter((player) => isReady(player.id)).length);
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
    <UCard class="stu-panel rounded-[2rem] border-0">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-semibold">{{ room }}</h2>
            <p class="text-sm text-[rgba(33,22,15,0.6)]">
              Everyone needs to mark ready before the game can begin.
            </p>
          </div>
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="isRefreshing"
            variant="ghost"
            label="Refresh room"
            @click="emit('refresh')"
          />
        </div>
      </template>

      <UAlert v-if="errorMessage" color="error" variant="soft" :title="errorMessage" class="mb-4" />

      <div class="mb-4 rounded-2xl bg-white/60 px-4 py-3 text-sm text-[rgba(33,22,15,0.68)]">
        {{ readyCount }} / {{ players.length }} players ready
        <span v-if="everyoneReady"> · starting now</span>
      </div>

      <div v-if="players.length" class="space-y-3">
        <div
          v-for="player in players"
          :key="player.id"
          class="rounded-2xl border border-[rgba(33,22,15,0.08)] bg-white/60 px-4 py-3"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="font-semibold">{{ player.name }}</div>
              <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.5)]">
                <span v-if="player.id === currentPlayerId">You</span>
                <span v-else>Player</span>
                <span> · {{ isActive(player.id) ? "Connected" : "Away" }}</span>
              </div>
            </div>
            <UBadge :color="isReady(player.id) ? 'success' : 'neutral'" variant="subtle">
              {{ isReady(player.id) ? "Ready" : "Waiting" }}
            </UBadge>
          </div>
        </div>
      </div>
      <div
        v-else
        class="rounded-2xl border border-dashed border-[rgba(33,22,15,0.14)] bg-white/40 px-4 py-6 text-sm text-[rgba(33,22,15,0.6)]"
      >
        {{ emptyMessage || "No one has joined this room yet." }}
      </div>

      <template #footer>
        <UButton
          :color="currentPlayerReady ? 'neutral' : 'primary'"
          :disabled="isStarting || isUpdatingReady"
          :icon="currentPlayerReady ? 'i-lucide-circle-off' : 'i-lucide-check-check'"
          :label="currentPlayerReady ? 'Not ready' : 'Ready to start'"
          :loading="isUpdatingReady"
          block
          size="xl"
          @click="emit('toggleReady')"
        />
      </template>
    </UCard>

    <UCard class="stu-panel rounded-[2rem] border-0">
      <template #header>
        <div>
          <h2 class="text-2xl font-semibold">Chat</h2>
          <p class="text-sm text-[rgba(33,22,15,0.6)]">Keep it quick while everyone gets ready.</p>
        </div>
      </template>

      <div v-if="chat.length" class="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        <div
          v-for="entry in chat"
          :key="`${entry.player}-${entry.time}`"
          class="rounded-2xl px-4 py-3"
          :class="entry.player === currentPlayerId ? 'bg-amber-100/70' : 'bg-white/70'"
        >
          <div class="mb-1 flex items-center justify-between gap-4 text-sm">
            <span class="font-semibold">{{ playerName(entry) }}</span>
            <span class="text-[rgba(33,22,15,0.5)]">
              {{
                new Date(entry.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
              }}
            </span>
          </div>
          <div class="text-sm">{{ entry.text }}</div>
        </div>
      </div>
      <div
        v-else
        class="rounded-2xl border border-dashed border-[rgba(33,22,15,0.14)] bg-white/40 px-4 py-6 text-sm text-[rgba(33,22,15,0.6)]"
      >
        No messages yet. Say hello to your table.
      </div>

      <template #footer>
        <div class="flex gap-3">
          <UInput
            :model-value="message"
            class="flex-1"
            placeholder="Type a message"
            size="xl"
            @update:model-value="emit('update', $event)"
            @keyup.enter="emit('send')"
          />
          <UButton
            color="secondary"
            icon="i-lucide-send"
            label="Send"
            size="xl"
            @click="emit('send')"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
