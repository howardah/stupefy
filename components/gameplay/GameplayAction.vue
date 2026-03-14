<script setup lang="ts">
import type { PopupState } from "~/utils/types";

defineProps<{
  actions: PopupState;
  running: boolean;
}>();

const emit = defineEmits<{
  choose: [value: string, index: number];
  dismiss: [];
}>();
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-4 sm:pb-4">
    <div
      v-if="actions.canDismiss === false"
      class="pointer-events-auto fixed inset-0 bg-[rgba(30,16,8,0.18)] backdrop-blur-[1.5px]"
      aria-hidden="true"
    />

    <div class="relative mx-auto w-full max-w-3xl">
      <UCard
        role="dialog"
        aria-modal="false"
        class="pointer-events-auto stu-panel rounded-[1.75rem] border-0 bg-[rgba(248,241,231,0.96)] shadow-[0_-24px_60px_rgba(39,21,10,0.16)]"
      >
        <template #header>
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-xs uppercase tracking-[0.2em] text-[rgba(33,22,15,0.55)]">
                Action
              </div>
              <h3 class="text-xl font-semibold">{{ actions.message }}</h3>
            </div>
            <UButton
              v-if="actions.canDismiss !== false"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              @click="emit('dismiss')"
            />
          </div>
        </template>

        <div class="space-y-3">
          <p class="text-sm text-[rgba(33,22,15,0.7)]">
            {{
              actions.canDismiss === false
                ? "Waiting for another player to respond."
                : running
                  ? "Choose what happens next."
                  : "The game is paused, so you can review this action but not change it."
            }}
          </p>

          <div v-if="actions.options.length === 0" class="flex justify-end">
            <UButton
              v-if="actions.canDismiss !== false"
              color="neutral"
              label="Continue"
              @click="emit('dismiss')"
            />
          </div>

          <div v-else class="grid gap-3 sm:grid-cols-2">
            <UButton
              v-for="(option, index) in actions.options"
              :key="`${option.function}-${index}`"
              :disabled="!running"
              color="primary"
              variant="soft"
              class="justify-center"
              @click="emit('choose', option.function, index)"
            >
              {{ option.label }}
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
