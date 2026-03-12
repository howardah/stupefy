<script setup lang="ts">
import type { PlayerState, WaitingChatMessage, WaitingPlayer, WaitingRoomState } from "~/utils/types";

const props = defineProps<{
  activePlayers: WaitingPlayer[];
  canStart: boolean;
  chat: WaitingChatMessage[];
  currentPlayerId: number;
  emptyMessage?: string;
  errorMessage?: string;
  isRefreshing: boolean;
  message: string;
  room: string;
}>();

const emit = defineEmits<{
  refresh: [];
  send: [];
  start: [];
  update: [value: string];
}>();

function playerName(message: WaitingChatMessage) {
  const match = props.activePlayers.find((player) => player.id === message.player);
  return match?.name || "unknown";
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[0.95fr_1.25fr]">
    <UCard class="stu-panel rounded-[2rem] border-0">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-semibold">{{ room }}</h2>
            <p class="text-sm text-[rgba(33,22,15,0.6)]">Waiting room</p>
          </div>
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="isRefreshing"
            variant="ghost"
            @click="emit('refresh')"
          />
        </div>
      </template>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        :title="errorMessage"
        class="mb-4"
      />

      <div v-if="activePlayers.length" class="space-y-3">
        <div
          v-for="player in activePlayers"
          :key="player.id"
          class="rounded-2xl border border-[rgba(33,22,15,0.08)] bg-white/60 px-4 py-3"
        >
          <div class="font-semibold">{{ player.name }}</div>
          <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.5)]">
            {{ player.id === currentPlayerId ? "You" : "Connected player" }}
          </div>
        </div>
      </div>
      <div
        v-else
        class="rounded-2xl border border-dashed border-[rgba(33,22,15,0.14)] bg-white/40 px-4 py-6 text-sm text-[rgba(33,22,15,0.6)]"
      >
        {{ emptyMessage || "No connected players yet." }}
      </div>

      <template #footer>
        <UButton
          :disabled="!canStart"
          block
          color="primary"
          icon="i-lucide-wand-sparkles"
          label="Start Game"
          size="xl"
          @click="emit('start')"
        />
      </template>
    </UCard>

    <UCard class="stu-panel rounded-[2rem] border-0">
      <template #header>
        <div>
          <h2 class="text-2xl font-semibold">Chat</h2>
          <p class="text-sm text-[rgba(33,22,15,0.6)]">
            Lobby updates are currently synchronized with HTTP polling.
          </p>
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
              {{ new Date(entry.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }}
            </span>
          </div>
          <div class="text-sm">{{ entry.text }}</div>
        </div>
      </div>
      <div
        v-else
        class="rounded-2xl border border-dashed border-[rgba(33,22,15,0.14)] bg-white/40 px-4 py-6 text-sm text-[rgba(33,22,15,0.6)]"
      >
        No chat yet. Break the silence.
      </div>

      <template #footer>
        <div class="flex gap-3">
          <UInput
            :model-value="message"
            class="flex-1"
            placeholder="Send a message"
            size="xl"
            @update:model-value="emit('update', $event)"
            @keyup.enter="emit('send')"
          />
          <UButton color="secondary" icon="i-lucide-send" size="xl" @click="emit('send')" />
        </div>
      </template>
    </UCard>
  </div>
</template>
