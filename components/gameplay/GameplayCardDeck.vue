<script setup lang="ts">
import type { DeckState, GameplayTarget } from "~/utils/types";
import { isDeckTargetClickable } from "~/utils/gameplay/board-ui";

const props = defineProps<{
  deck: DeckState;
  targets: GameplayTarget[];
}>();

const emit = defineEmits<{
  clickPile: [pile: "draw" | "discard"];
}>();

const drawClickable = computed(() => isDeckTargetClickable(props.targets, "draw"));
const discardClickable = computed(() => isDeckTargetClickable(props.targets, "discard"));
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2">
    <div class="space-y-2">
      <GameplayCard
        :card="deck.cards[0] || { name: '', fileName: '', house: '', power: {} }"
        :concealed="Boolean(deck.cards[0])"
        :clickable="drawClickable"
        pile-label="Draw pile"
        @click="emit('clickPile', 'draw')"
      />
      <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.55)]">
        {{ deck.cards.length }} cards left
      </div>
    </div>

    <div class="space-y-2">
      <GameplayCard
        :card="deck.discards[0] || { name: '', fileName: '', house: '', power: {} }"
        :clickable="discardClickable"
        pile-label="Discard"
        @click="emit('clickPile', 'discard')"
      />
      <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.55)]">
        {{ deck.discards.length }} discarded
      </div>
    </div>
  </div>
</template>
