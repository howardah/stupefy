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
  <div class="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(18,10,5,0.46)] p-4">
    <UCard class="stu-panel w-full max-w-xl rounded-[2rem] border-0">
      <template #header>
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-xs uppercase tracking-[0.2em] text-[rgba(33,22,15,0.55)]">Action</div>
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
</template>
