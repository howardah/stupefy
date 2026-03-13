<script setup lang="ts">
import type { BoardAlert, BoardViewState, CharacterCard, GameCard, GameplayTarget, PlayerState, PopupState } from "~/utils/types";

defineProps<{
  actions: PopupState;
  alerts: BoardAlert[];
  boardState: BoardViewState;
  canEndTurn: boolean;
  currentPlayer: PlayerState | null;
  nextTurn: number | null;
  orderedPlayers: PlayerState[];
  roomName: string;
  targets: GameplayTarget[];
}>();

const emit = defineEmits<{
  chooseAction: [value: string, index: number];
  chooseCharacter: [character: CharacterCard];
  clearAction: [];
  clickCharacter: [playerId: number];
  clickDeckPile: [pile: "draw" | "discard"];
  clickHand: [playerId: number, card: GameCard];
  clickTable: [card: GameCard];
  clickTableau: [playerId: number, card: GameCard];
  closeAlert: [id: string];
  endTurn: [];
  resetBoard: [];
  toggleCards: [];
}>();

function onChooseAction(value: string, index: number) {
  emit("chooseAction", value, index);
}

function onClickHand(playerId: number, card: GameCard) {
  emit("clickHand", playerId, card);
}

function onClickTableau(playerId: number, card: GameCard) {
  emit("clickTableau", playerId, card);
}
</script>

<template>
  <div class="relative">
    <GameplayAction
      v-if="actions.message"
      :actions="actions"
      :running="boardState.running"
      @choose="onChooseAction"
      @dismiss="emit('clearAction')"
    />

    <GameplayChooseCharacter
      v-if="orderedPlayers[0] && Array.isArray(orderedPlayers[0].character)"
      :player="orderedPlayers[0]"
      @choose="emit('chooseCharacter', $event)"
    />

    <div class="pointer-events-none absolute right-0 top-0 z-20 h-0">
      <GameplayAlert
        v-for="(alert, index) in alerts"
        :key="alert.id"
        :alert="alert"
        :index="index"
        @close="emit('closeAlert', $event)"
      />
    </div>

    <div class="space-y-6">
      <GameplaySidebar
        :board-state="boardState"
        :can-end-turn="canEndTurn"
        :current-player="currentPlayer"
        :next-turn="nextTurn"
        :players="orderedPlayers"
        :room-name="roomName"
        @end-turn="emit('endTurn')"
        @reset-board="emit('resetBoard')"
        @toggle-cards="emit('toggleCards')"
      />

      <div class="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <UCard class="stu-panel rounded-[1.8rem] border-0">
          <template #header>
            <div class="text-xs uppercase tracking-[0.2em] text-[rgba(33,22,15,0.55)]">Deck</div>
          </template>
          <GameplayCardDeck :deck="boardState.deck" :targets="targets" @click-pile="emit('clickDeckPile', $event)" />
        </UCard>

        <GameplayTable :table="boardState.table" :targets="targets" @click-card="emit('clickTable', $event)" />
      </div>

      <GameplayPlayer
        v-for="(player, index) in orderedPlayers"
        :key="player.id"
        :board-state="boardState"
        :index="index"
        :player="player"
        :players="orderedPlayers"
        :targets="targets"
        @click-character="emit('clickCharacter', $event)"
        @click-hand="onClickHand"
        @click-tableau="onClickTableau"
      />
    </div>
  </div>
</template>
