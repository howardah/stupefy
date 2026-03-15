<script setup lang="ts">
import type { GameCard, GameplayTarget } from "@shared/utils/types";
import { EMPTY_CARD, isTableCardClickable } from "@shared/utils/gameplay/board-ui";

const props = defineProps<{
  table: GameCard[];
  targets: GameplayTarget[];
}>();

const emit = defineEmits<{
  clickCard: [card: GameCard];
}>();

const tableCards = computed(() => {
  if (props.table.length > 0) {
    return [...props.table, EMPTY_CARD];
  }

  return [EMPTY_CARD, EMPTY_CARD];
});
</script>

<template>
  <div class="rounded-[1.8rem] border border-[rgba(82,57,29,0.12)] bg-[rgba(255,251,245,0.6)] p-4">
    <div class="mb-3 text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.55)]">Table</div>
    <div class="flex flex-wrap gap-3">
      <GameplayCard
        v-for="(card, index) in tableCards"
        :key="`${card.id || 'empty'}-${index}`"
        :card="card"
        :clickable="isTableCardClickable(card, targets)"
        @click="emit('clickCard', card)"
      />
    </div>
  </div>
</template>
