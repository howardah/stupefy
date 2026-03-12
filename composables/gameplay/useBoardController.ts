import type { ComputedRef } from "vue";
import type { BoardAlert, BoardViewState, CharacterCard, GameCard } from "~/utils/types";
import Deck from "~/utils/deck";
import { cloneBoardViewState } from "~/utils/gameplay/bootstrap";
import { rotatePlayersForViewer } from "~/utils/gameplay/board-ui";
import { cardIndex, cardsInclude, getPrimaryCharacter, playerIndex } from "~/utils/gameplay/core";
import { getPopupState, tableauProblems } from "~/utils/gameplay/events";
import { getAvailableTargets, getCardTargets } from "~/utils/gameplay/targeting";
import {
  cycleCleanse,
  endTurnState,
  incrementTurn,
  setupTurnCycleForTurn,
} from "~/utils/gameplay/turn-cycle";

const POPUP_EMPTY = { message: "", options: [] };

function cloneSelectedCards(cards: GameCard[]) {
  return cards.map((card) => ({ ...card, power: { ...card.power } }));
}

function syncActions(state: BoardViewState) {
  state.actions = getPopupState(state.events, state.playerId);
}

function ensureTurnCyclePlayerState(state: BoardViewState, playerId: number) {
  const key = `id${playerId}`;
  const currentValue = state.turnCycle[key];

  if (!currentValue || typeof currentValue !== "object" || !("cards" in currentValue)) {
    state.turnCycle[key] = { cards: [] };
  }

  return state.turnCycle[key] as { cards: GameCard[]; choice?: string };
}

function activePlayer(state: BoardViewState) {
  const index = playerIndex(state.players, state.turn);
  return index === -1 ? null : state.players[index]!;
}

function viewerPlayer(state: BoardViewState) {
  const index = playerIndex(state.players, state.playerId);
  return index === -1 ? null : state.players[index]!;
}

export function useBoardController(sourceBoardState: ComputedRef<BoardViewState | null>) {
  const toast = useToast();
  const localBoardState = ref<BoardViewState | null>(null);
  const alerts = ref<BoardAlert[]>([]);

  function pushAlert(message: string, tone: BoardAlert["tone"] = "warning") {
    const alert = {
      id: crypto.randomUUID(),
      message,
      tone,
    } satisfies BoardAlert;

    alerts.value.push(alert);
    console.warn("[play] Board interaction warning:", message);
    toast.add({
      title: tone === "error" ? "Board error" : "Board update",
      description: message,
      color: tone === "error" ? "error" : tone === "info" ? "info" : "warning",
      icon: tone === "error" ? "i-lucide-octagon-alert" : "i-lucide-sparkles",
    });
  }

  watch(
    sourceBoardState,
    (nextState) => {
      localBoardState.value = nextState ? cloneBoardViewState(nextState) : null;
      alerts.value = [];
    },
    { immediate: true }
  );

  const boardState = computed(() => localBoardState.value);
  const orderedPlayers = computed(() =>
    boardState.value ? rotatePlayersForViewer(boardState.value.players, boardState.value.playerId) : []
  );
  const currentActions = computed(() =>
    boardState.value ? getPopupState(boardState.value.events, boardState.value.playerId) : POPUP_EMPTY
  );
  const availableTargets = computed(() =>
    boardState.value ? getAvailableTargets(boardState.value) : []
  );
  const actionTargets = computed(() =>
    boardState.value
      ? getCardTargets(boardState.value.turnCycle.action, boardState.value.turnCycle)
      : []
  );
  const isMyTurn = computed(
    () => Boolean(boardState.value && boardState.value.turn === boardState.value.playerId)
  );
  const canEndTurn = computed(
    () =>
      Boolean(
        boardState.value &&
          boardState.value.turn === boardState.value.playerId &&
          boardState.value.turnCycle.phase === "initial"
      )
  );
  const choosingCharacter = computed(() => {
    const currentPlayer = orderedPlayers.value[0];
    return Boolean(currentPlayer && Array.isArray(currentPlayer.character));
  });

  function removeAlert(id: string) {
    alerts.value = alerts.value.filter((alert) => alert.id !== id);
  }

  function resetBoard() {
    localBoardState.value = sourceBoardState.value ? cloneBoardViewState(sourceBoardState.value) : null;
    alerts.value = [];
  }

  function withBoardState(
    action: (state: BoardViewState) => void | boolean | BoardViewState,
    fallbackMessage?: string
  ) {
    if (!localBoardState.value) {
      return;
    }

    const next = cloneBoardViewState(localBoardState.value);
    const result = action(next);

    if (result === false) {
      if (fallbackMessage) {
        pushAlert(fallbackMessage, "error");
      }
      return;
    }

    localBoardState.value =
      result && typeof result === "object" && result !== next ? result : next;
    syncActions(localBoardState.value);
  }

  function toggleCards() {
    withBoardState((state) => {
      state.showCards = !state.showCards;
    });
  }

  function chooseCharacter(character: CharacterCard) {
    withBoardState((state) => {
      const player = viewerPlayer(state);
      if (!player || !Array.isArray(player.character)) {
        pushAlert("Character selection is not available for this player.", "error");
        return false;
      }

      const deck = new Deck([...state.deck.cards], [...state.deck.discards]);
      const nextCharacter = { ...character, power: { ...character.power } };

      if (player.role === "minister") {
        nextCharacter.health += 1;
        nextCharacter.maxHealth += 1;
      }

      player.character = nextCharacter;
      player.power = [nextCharacter.fileName];
      player.hand = deck.drawCards(nextCharacter.health);
      state.deck = deck;

      if (!state.players.some((entry) => Array.isArray(entry.character))) {
        const setup = setupTurnCycleForTurn(state.players, state.turn);
        state.turnCycle = setup.turnCycle;
        state.events = setup.events ?? [];
      }
    });
  }

  function selectOwnHandCard(state: BoardViewState, card: GameCard) {
    const { turnCycle } = state;

    if (turnCycle.phase === "initial") {
      turnCycle.cards = [card];
      turnCycle.phase = "selected";
      turnCycle.action = card.name;
      return true;
    }

    if (turnCycle.phase === "stuck-in-azkaban") {
      turnCycle.cards = [card];
      turnCycle.phase = "selected-stuck-in-azkaban";
      turnCycle.action = "discard";
      return true;
    }

    if (turnCycle.phase === "selected-stuck-in-azkaban") {
      if (cardsInclude(turnCycle.cards, card)) {
        turnCycle.cards.splice(cardIndex(turnCycle.cards, card), 1);
      } else {
        turnCycle.cards.push(card);
      }

      if (turnCycle.cards.length === 0) {
        turnCycle.phase = "stuck-in-azkaban";
      }

      return true;
    }

    if (turnCycle.phase === "selected") {
      if (cardsInclude(turnCycle.cards, card)) {
        turnCycle.cards.splice(cardIndex(turnCycle.cards, card), 1);
      } else {
        turnCycle.cards.push(card);
        turnCycle.action = "discard";
      }

      if (
        turnCycle.cards.length === 2 &&
        turnCycle.cards.some((entry) => entry.name === "stupefy") &&
        turnCycle.cards.some((entry) => entry.name === "felix_felicis")
      ) {
        turnCycle.action = "felix";
      } else if (turnCycle.cards.length === 1) {
        turnCycle.action = turnCycle.cards[0]!.name;
      } else if (turnCycle.cards.length === 0) {
        state.turnCycle = cycleCleanse(turnCycle, state.players, state.turn);
      }

      return true;
    }

    if (turnCycle.phase === "attack") {
      const reactionState = ensureTurnCyclePlayerState(state, state.playerId);

      if (cardsInclude(reactionState.cards, card)) {
        reactionState.cards.splice(cardIndex(reactionState.cards, card), 1);
      } else {
        reactionState.cards.push(card);
      }

      return true;
    }

    return false;
  }

  function discardSelectedCards(state: BoardViewState) {
    const deck = new Deck([...state.deck.cards], [...state.deck.discards]);
    const currentPlayer = viewerPlayer(state);

    if (!currentPlayer) {
      return false;
    }

    const selectedCards = cloneSelectedCards(state.turnCycle.cards);
    if (selectedCards.length === 0) {
      pushAlert("Select at least one card before discarding.", "info");
      return true;
    }

    for (const selectedCard of selectedCards) {
      const handLocation = currentPlayer.hand.findIndex((card) => card.id === selectedCard.id);
      if (handLocation !== -1) {
        const [discardedCard] = currentPlayer.hand.splice(handLocation, 1);
        if (discardedCard) {
          deck.discards.unshift(discardedCard);
        }
        continue;
      }

      const tableauLocation = currentPlayer.tableau.findIndex((card) => card.id === selectedCard.id);
      if (tableauLocation !== -1) {
        const [discardedCard] = currentPlayer.tableau.splice(tableauLocation, 1);
        if (discardedCard) {
          deck.discards.unshift(discardedCard);
        }
      }
    }

    state.deck = deck;
    state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
    return true;
  }

  function placeSelectedCardOnTableau(state: BoardViewState, targetPlayerId: number) {
    const handOwner = viewerPlayer(state);
    const targetPlayer = state.players.find((player) => player.id === targetPlayerId);
    const selectedCard = state.turnCycle.cards[0];

    if (!handOwner || !targetPlayer || !selectedCard) {
      return false;
    }

    const selectedIndex = handOwner.hand.findIndex((card) => card.id === selectedCard.id);
    if (selectedIndex === -1) {
      return false;
    }

    const [movedCard] = handOwner.hand.splice(selectedIndex, 1);
    if (!movedCard) {
      return false;
    }

    targetPlayer.tableau.push(movedCard);
    const tableauProblem = tableauProblems(targetPlayer.tableau);
    if (tableauProblem) {
      handOwner.hand.splice(selectedIndex, 0, movedCard);
      targetPlayer.tableau.pop();
      pushAlert(tableauProblem, "warning");
      return true;
    }

    state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
    return true;
  }

  function handleHandClick(playerId: number, card: GameCard) {
    withBoardState((state) => {
      if (playerId !== state.playerId) {
        pushAlert(
          "Targeting cards in another player's hand still depends on the unported rule engine.",
          "info"
        );
        return true;
      }

      if (!selectOwnHandCard(state, card)) {
        pushAlert(`No hand action is available during "${state.turnCycle.phase}".`, "info");
      }
    });
  }

  function handleTableauClick(playerId: number, card: GameCard) {
    withBoardState((state) => {
      const { turnCycle } = state;

      if (playerId === state.playerId) {
        if (turnCycle.phase === "initial") {
          turnCycle.cards = [card];
          turnCycle.phase = "selected-tableau";
          turnCycle.action = "discard";

          if (
            card.name === "resurrection_stone" &&
            !turnCycle.used.includes("ressurection_stone")
          ) {
            turnCycle.phase = "ressurection_stone";
            turnCycle.action = "ressurection_stone";
          }

          return true;
        }

        if (
          turnCycle.phase === "selected-tableau" ||
          turnCycle.phase === "ressurection_stone"
        ) {
          if (cardsInclude(turnCycle.cards, card)) {
            turnCycle.cards.splice(cardIndex(turnCycle.cards, card), 1);
          } else {
            turnCycle.cards.push(card);
            turnCycle.phase = "selected-tableau";
          }

          if (
            turnCycle.cards.length === 1 &&
            turnCycle.cards[0]?.name === "resurrection_stone" &&
            !turnCycle.used.includes("ressurection_stone")
          ) {
            turnCycle.phase = "ressurection_stone";
            turnCycle.action = "ressurection_stone";
          }

          if (turnCycle.cards.length === 0) {
            state.turnCycle = cycleCleanse(turnCycle, state.players, state.turn);
          }

          return true;
        }
      }

      if (
        turnCycle.phase === "selected" &&
        (actionTargets.value.includes("my-tableau-empty") ||
          actionTargets.value.includes("tableau-empty")) &&
        card.fileName === ""
      ) {
        return placeSelectedCardOnTableau(state, playerId);
      }

      pushAlert(
        "This tableau interaction still depends on the unported card-rule engine.",
        "info"
      );
      return true;
    });
  }

  function handleCharacterClick(playerId: number) {
    withBoardState((state) => {
      if (
        state.turnCycle.phase === "selected" &&
        (actionTargets.value.includes("my-tableau-empty") ||
          actionTargets.value.includes("tableau-empty"))
      ) {
        return placeSelectedCardOnTableau(state, playerId);
      }

      pushAlert(
        "Character targeting is not fully ported yet because the card-rule handlers still need migration.",
        "info"
      );
      return true;
    });
  }

  function handleTableClick(card: GameCard) {
    withBoardState((state) => {
      if (state.turnCycle.phase === "selected" && state.turnCycle.action === "discard") {
        return discardSelectedCards(state);
      }

      if (card.fileName === "" && availableTargets.value.includes("table-empty")) {
        pushAlert(
          "Table event resolution still depends on the unported card-rule engine.",
          "info"
        );
        return true;
      }

      pushAlert("Table interactions are not fully ported yet.", "info");
      return true;
    });
  }

  function handleDeckClick(pile: "draw" | "discard") {
    withBoardState((state) => {
      const deck = new Deck([...state.deck.cards], [...state.deck.discards]);
      const player = viewerPlayer(state);

      if (!player) {
        return false;
      }

      if (pile === "draw" && state.turnCycle.phase === "initial") {
        const drawnCard = deck.drawCards(1)[0];
        if (!drawnCard) {
          pushAlert("The draw pile is empty.", "warning");
          return true;
        }

        player.hand.unshift(drawnCard);
        state.deck = deck;
        state.turnCycle.draw = Math.max(0, state.turnCycle.draw - 1);
        return true;
      }

      if (pile === "discard" && availableTargets.value.includes("discard")) {
        return discardSelectedCards(state);
      }

      pushAlert(
        `The ${pile} pile click path still needs the legacy rule handlers for this phase.`,
        "info"
      );
      return true;
    });
  }

  function clearResolutionAction() {
    withBoardState((state) => {
      if (state.events.length === 0) {
        return true;
      }

      state.events.shift();
    });
  }

  function endTurn() {
    withBoardState((state) => {
      if (!canEndTurn.value) {
        pushAlert("You can only end your turn from the initial phase.", "info");
        return true;
      }

      const turnEnded = endTurnState(state);
      if (!turnEnded) {
        pushAlert("The turn could not be ended from the current board state.", "error");
        return false;
      }

      if (turnEnded.alert) {
        pushAlert(turnEnded.alert, "warning");
        return true;
      }

      Object.assign(state, turnEnded.nextState);

      const nextTurn = incrementTurn(state.turn, state.turnOrder, state.deadPlayers);
      state.turn = nextTurn;

      const nextPlayer = activePlayer(state);
      if (nextPlayer) {
        const character = getPrimaryCharacter(nextPlayer);
        nextPlayer.power = character?.fileName ? [character.fileName] : [];
      }

      const setup = setupTurnCycleForTurn(state.players, nextTurn);
      state.turnCycle = setup.turnCycle;
      state.events = setup.events ?? [];
      return true;
    });
  }

  return {
    actionTargets,
    actions: currentActions,
    alerts,
    availableTargets,
    boardState,
    canEndTurn,
    chooseCharacter,
    choosingCharacter,
    clearResolutionAction,
    endTurn,
    handleCharacterClick,
    handleDeckClick,
    handleHandClick,
    handleTableClick,
    handleTableauClick,
    isMyTurn,
    orderedPlayers,
    removeAlert,
    resetBoard,
    toggleCards,
  };
}
