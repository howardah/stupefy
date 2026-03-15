<script setup lang="ts">
import type { GameCard } from "@shared/utils/types";

const props = withDefaults(
  defineProps<{
    card: GameCard;
    clickable?: boolean;
    concealed?: boolean;
    selected?: boolean;
    pileLabel?: string;
  }>(),
  {
    clickable: false,
    concealed: false,
    pileLabel: "",
    selected: false,
  },
);

const emit = defineEmits<{
  click: [];
}>();

const isEmpty = computed(() => !props.card.fileName);

const cardClasses = computed(() => [
  "group relative h-36 w-24 overflow-hidden rounded-[0.5rem] border text-left transition md:h-40 md:w-28",
  isEmpty.value
    ? "border-dashed border-[rgba(82,57,29,0.18)] bg-[rgba(255,251,245,0.55)]"
    : "border-[rgba(82,57,29,0.16)] bg-[rgba(255,251,245,0.86)] shadow-[0_10px_30px_rgba(61,39,16,0.12)]",
  props.clickable
    ? "cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(61,39,16,0.18)]"
    : "",
  props.selected
    ? "ring-2 ring-[rgba(180,83,9,0.75)] ring-offset-2 ring-offset-[rgba(245,239,226,0.9)]"
    : "",
]);

const backgroundStyle = computed(() => {
  if (props.concealed || isEmpty.value) {
    return {};
  }

  return {
    backgroundImage: `linear-gradient(rgba(20, 12, 7, 0.08), rgba(20, 12, 7, 0.22)), url('/images/stupefy/${props.card.fileName}.jpg')`,
    backgroundPosition: "center",
    backgroundSize: "cover",
  };
});
</script>

<template>
  <button
    type="button"
    :disabled="!clickable"
    :class="cardClasses"
    :style="backgroundStyle"
    @click="emit('click')"
  >
    <div
      v-if="pileLabel"
      class="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white"
    >
      {{ pileLabel }}
    </div>
    <div
      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(20,12,7,0.9)] via-[rgba(20,12,7,0.64)] to-transparent px-2 py-2 text-[11px] leading-tight text-white"
    >
      <div class="font-semibold">
        {{ concealed && !isEmpty ? "Hidden card" : card.name || "Empty slot" }}
      </div>
      <div
        v-if="card.house && !concealed"
        class="text-[10px] uppercase tracking-[0.16em] text-white/75"
      >
        {{ card.house }}
      </div>
    </div>
  </button>
</template>
