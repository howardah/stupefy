<script setup lang="ts">
import type { BoardViewState, GameCard, GameplayTarget, PlayerState } from "~/utils/types";
import {
  EMPTY_CARD,
  canApparateBetween,
  isCharacterTargetClickable,
  isHandTargetClickable,
  isTableauTargetClickable,
} from "~/utils/gameplay/board-ui";
import { getPrimaryCharacter } from "~/utils/gameplay/core";

const props = defineProps<{
  boardState: BoardViewState;
  index: number;
  player: PlayerState;
  players: PlayerState[];
  targets: GameplayTarget[];
}>();

const emit = defineEmits<{
  clickCharacter: [playerId: number];
  clickHand: [playerId: number, card: GameCard];
  clickTableau: [playerId: number, card: GameCard];
}>();

const character = computed(() => getPrimaryCharacter(props.player));
const tableau = computed(() => [...props.player.tableau, EMPTY_CARD]);
const isSelf = computed(() => props.player.id === props.boardState.playerId);
const isDead = computed(() => props.boardState.deadPlayers.includes(props.player.id));

function selected(card: GameCard) {
  return props.boardState.turnCycle.cards.some((currentCard) => currentCard.id === card.id);
}

function reactionSelected(card: GameCard) {
  const reactionState = props.boardState.turnCycle[`id${props.player.id}`];
  if (!reactionState || typeof reactionState !== "object" || !("cards" in reactionState)) {
    return false;
  }

  return Array.isArray(reactionState.cards)
    ? reactionState.cards.some((entry: GameCard) => entry.id === card.id)
    : false;
}
</script>

<template>
  <section
    class="rounded-[1.8rem] border p-4 transition"
    :class="[
      isSelf ? 'border-[rgba(180,83,9,0.28)] bg-[rgba(255,249,241,0.85)]' : 'border-[rgba(82,57,29,0.12)] bg-[rgba(255,251,245,0.62)]',
      isDead ? 'opacity-65 saturate-50' : '',
    ]"
  >
    <div class="mb-4 flex items-start justify-between gap-3">
      <div>
        <div class="text-lg font-semibold">{{ player.name }}</div>
        <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.55)]">
          {{ player.role || "Unknown role" }}
          <span v-if="boardState.turn === player.id"> · current turn</span>
          <span v-else-if="isSelf"> · you</span>
        </div>
      </div>
      <UBadge
        :color="boardState.turn === player.id ? 'primary' : isSelf ? 'secondary' : 'neutral'"
        variant="subtle"
      >
        {{ character?.health ?? 0 }} / {{ character?.maxHealth ?? 0 }} health
      </UBadge>
    </div>

    <div class="grid gap-4 lg:grid-cols-[auto_1fr]">
      <GameplayCharacter
        v-if="character"
        :character="character"
        :clickable="isCharacterTargetClickable(player, boardState.playerId, targets, players)"
        :selected="boardState.turnCycle.felix.some((entry) => typeof entry === 'object' && 'id' in entry && entry.id === player.id)"
        @click="emit('clickCharacter', player.id)"
      />

      <div class="space-y-4">
        <div class="space-y-2">
          <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.55)]">Tableau</div>
          <div class="flex flex-wrap gap-3">
            <GameplayCard
              v-for="(card, cardIndex) in tableau"
              :key="`${card.id || 'empty'}-${cardIndex}`"
              :card="card"
              :clickable="isTableauTargetClickable(player, boardState.playerId, targets, players, card)"
              :selected="selected(card)"
              @click="emit('clickTableau', player.id, card)"
            />
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-xs uppercase tracking-[0.18em] text-[rgba(33,22,15,0.55)]">
            Hand · {{ player.hand.length }} cards
          </div>
          <div class="flex flex-wrap gap-3">
            <GameplayCard
              v-for="(card, cardIndex) in player.hand"
              :key="`${card.id}-${cardIndex}`"
              :card="card"
              :concealed="!isSelf && !boardState.showCards"
              :clickable="isHandTargetClickable(player, boardState.playerId, targets, players)"
              :selected="selected(card) || reactionSelected(card)"
              @click="emit('clickHand', player.id, card)"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="canApparateBetween(index, players, targets)"
      class="mt-4 rounded-2xl border border-dashed border-[rgba(82,57,29,0.18)] px-4 py-3 text-sm text-[rgba(33,22,15,0.62)]"
    >
      Apparate positioning between players is detected here, but the move itself still depends on the unported spell rules.
    </div>
  </section>
</template>
