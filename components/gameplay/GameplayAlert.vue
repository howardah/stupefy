<script setup lang="ts">
import type { BoardAlert } from "~/utils/types";

defineProps<{
  alert: BoardAlert;
  index: number;
}>();

const emit = defineEmits<{
  close: [id: string];
}>();
</script>

<template>
  <UAlert
    :color="alert.tone === 'error' ? 'error' : alert.tone === 'info' ? 'info' : 'warning'"
    variant="subtle"
    :ui="{ root: 'shadow-[0_12px_28px_rgba(61,39,16,0.12)]' }"
    :style="{ top: `${index * 82}px` }"
    class="absolute right-0 z-20 w-full max-w-sm"
    :title="alert.tone === 'error' ? 'Board error' : 'Board notice'"
    :description="alert.message"
    close
    @update:open="emit('close', alert.id)"
  />
</template>
