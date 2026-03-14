<script setup lang="ts">
import type { CharacterCard } from "~/utils/types";

const props = withDefaults(
  defineProps<{
    character: CharacterCard;
    clickable?: boolean;
    selected?: boolean;
  }>(),
  {
    clickable: false,
    selected: false,
  },
);

const emit = defineEmits<{
  click: [];
}>();

const healthPips = computed(() =>
  Array.from({ length: props.character.health }, (_, index) => index),
);
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <button
      type="button"
      :disabled="!clickable"
      class="relative h-40 w-28 overflow-hidden rounded-[1.35rem] border border-[rgba(82,57,29,0.18)] bg-[rgba(255,251,245,0.92)] shadow-[0_12px_30px_rgba(61,39,16,0.15)] transition md:h-44 md:w-32"
      :class="[
        clickable
          ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(61,39,16,0.18)]'
          : '',
        selected
          ? 'ring-2 ring-[rgba(180,83,9,0.75)] ring-offset-2 ring-offset-[rgba(245,239,226,0.9)]'
          : '',
      ]"
      :style="{
        backgroundImage: `linear-gradient(rgba(20, 12, 7, 0.05), rgba(20, 12, 7, 0.15)), url('/images/stupefy/characters/${character.fileName}.jpg')`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }"
      @click="emit('click')"
    >
      <div
        class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(20,12,7,0.92)] via-[rgba(20,12,7,0.6)] to-transparent px-3 py-3 text-left text-white"
      >
        <div class="text-sm font-semibold">{{ character.shortName }}</div>
        <div class="text-[10px] uppercase tracking-[0.18em] text-white/75">
          {{ character.house || "No house" }}
        </div>
      </div>
    </button>

    <div class="flex flex-wrap justify-center gap-1">
      <span
        v-for="pip in healthPips"
        :key="pip"
        class="h-2.5 w-2.5 rounded-full bg-[rgba(180,83,9,0.88)] shadow-[0_0_0_2px_rgba(255,248,237,0.8)]"
      />
    </div>
  </div>
</template>
