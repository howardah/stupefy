<script setup lang="ts">
import type { CharacterCard } from "~/utils/types";

defineProps<{
  character: CharacterCard;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    class="group relative h-48 w-32 overflow-hidden rounded-[1.4rem] border border-[rgba(82,57,29,0.16)] bg-[rgba(255,251,245,0.92)] text-left shadow-[0_12px_30px_rgba(61,39,16,0.15)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(61,39,16,0.18)]"
    :style="{
      backgroundImage: `linear-gradient(rgba(20, 12, 7, 0.08), rgba(20, 12, 7, 0.18)), url('/images/stupefy/characters/${character.fileName}.jpg')`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    }"
    @click="emit('click')"
  >
    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(20,12,7,0.92)] via-[rgba(20,12,7,0.58)] to-transparent px-3 py-3 text-white">
      <div class="text-sm font-semibold">{{ character.name }}</div>
      <div class="text-[10px] uppercase tracking-[0.18em] text-white/75">
        {{ character.house || "No house" }} · {{ character.health }} health
      </div>
    </div>
  </button>
</template>
