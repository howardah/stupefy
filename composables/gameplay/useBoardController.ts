import type { ComputedRef } from "vue";
import type {
  BoardAlert,
  BoardMutationKind,
  BoardViewState,
  CharacterCard,
  GameCard,
} from "~/utils/types";
import Deck from "~/utils/deck";
import { cloneBoardViewState } from "~/utils/gameplay/bootstrap";
import { rotatePlayersForViewer } from "~/utils/gameplay/board-ui";
import {
  handleRuleCharacterClick,
  handleRuleDeckClick,
  handleRuleHandClick,
  handleRulePopupChoice,
  handleRuleTableClick,
  handleRuleTableauClick,
} from "~/utils/gameplay/card-rules";
import { cardIndex, cardsInclude, getPrimaryCharacter, playerIndex } from "~/utils/gameplay/core";
import { getPopupState, tableauProblems } from "~/utils/gameplay/events";
import {
  canUseDobbyPower,
  copiedPowerName,
  dobbyHasClothes,
  hasPower,
  isGrayCard,
} from "~/utils/gameplay/powers";
import { getGameplaySyncSignature } from "~/utils/gameplay/sync";
import { getAvailableTargets, getCardTargets } from "~/utils/gameplay/targeting";
import {
  cycleCleanse,
  endTurnState,
  incrementTurn,
  setupTurnCycleForTurn,
} from "~/utils/gameplay/turn-cycle";

const POPUP_EMPTY = { canDismiss: true, message: "", options: [] };

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

function resetSelection(state: BoardViewState) {
  state.turnCycle.cards = [];
  state.turnCycle.action = "";
  state.turnCycle.felix = [];
  state.turnCycle.phase = "initial";
}

export function useBoardController(sourceBoardState: ComputedRef<BoardViewState | null>) {
  const toast = useToast();
  const localBoardState = ref<BoardViewState | null>(null);
  const alerts = ref<BoardAlert[]>([]);
  const mutationNonce = ref(0);
  const authoritativeSignature = ref<string | null>(null);

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
      const nextSignature = nextState ? getGameplaySyncSignature(nextState) : null;

      if (nextSignature === authoritativeSignature.value) {
        return;
      }

      authoritativeSignature.value = nextSignature;
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
          (
            boardState.value.turnCycle.phase === "initial" ||
            boardState.value.turnCycle.phase === "stuck-in-azkaban"
          )
      )
  );
  const choosingCharacter = computed(() => {
    const currentPlayer = orderedPlayers.value[0];
    return Boolean(currentPlayer && Array.isArray(currentPlayer.character));
  });
  const powerActions = computed(() => {
    if (!boardState.value) {
      return [];
    }

    const player = viewerPlayer(boardState.value);
    if (!player) {
      return [];
    }

    const actions: Array<{ id: string; label: string }> = [];
    const selectedCards = boardState.value.turnCycle.cards;
    const isTurnPlayer = boardState.value.turn === player.id;
    const copiedPower = copiedPowerName(player);

    if (isTurnPlayer && boardState.value.turnCycle.phase === "initial") {
      if (hasPower(player, "james_potter") && !boardState.value.turnCycle.used.includes("james_potter")) {
        actions.push({ id: "james_potter", label: "James: Lose 1, draw 2" });
      }

      if (canUseDobbyPower(player) && !boardState.value.turnCycle.used.includes("dobby_stupefy")) {
        actions.push({
          id: dobbyHasClothes(player) ? "dobby_stupefy" : "dobby_punish_stupefy",
          label: dobbyHasClothes(player) ? "Dobby: Free Stupefy" : "Dobby: Self-hit Stupefy",
        });
      }

      if (
        (hasPower(player, "nymphadora_tonks") || copiedPower === "nymphadora_tonks") &&
        !boardState.value.turnCycle.used.includes("tonks_copy")
      ) {
        actions.push({ id: "tonks_copy", label: "Tonks: Copy power" });
      }
    }

    if (
      isTurnPlayer &&
      (boardState.value.turnCycle.phase === "initial" || boardState.value.turnCycle.phase === "selected") &&
      selectedCards.length === 2 &&
      hasPower(player, "fenrir_greyback")
    ) {
      actions.push({ id: "fenrir_stupefy", label: "Fenrir: 2-card Stupefy" });
    }

    if (
      isTurnPlayer &&
      (boardState.value.turnCycle.phase === "initial" || boardState.value.turnCycle.phase === "selected") &&
      selectedCards.length === 2 &&
      hasPower(player, "neville_longbottom")
    ) {
      actions.push({ id: "neville_longbottom", label: "Neville: Heal 1" });
    }

    if (
      isTurnPlayer &&
      (boardState.value.turnCycle.phase === "initial" || boardState.value.turnCycle.phase === "selected") &&
      selectedCards.length === 1 &&
      hasPower(player, "minerva_mchonagall") &&
      isGrayCard(selectedCards[0]!) &&
      boardState.value.turnCycle.used.filter((entry) => entry === "minerva_mchonagall").length < 2
    ) {
      actions.push({ id: "minerva_mchonagall", label: "Minerva: Discard gray, draw 2" });
    }

    if (selectedCards.length === 1 && selectedCards[0]?.name === "protego" && hasPower(player, "molly_weasley")) {
      actions.push({ id: "molly_protego", label: "Molly: Give Protego" });
    }

    return actions;
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
    fallbackMessage?: string,
    kind: BoardMutationKind = "gameplay"
  ) {
    if (!localBoardState.value) {
      return;
    }

    const next = cloneBoardViewState(localBoardState.value);
    const previousSignature = getGameplaySyncSignature(localBoardState.value);
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

    if (kind === "gameplay") {
      const nextSignature = getGameplaySyncSignature(localBoardState.value);
      if (nextSignature !== previousSignature) {
        mutationNonce.value += 1;
      }
    }
  }

  function toggleCards() {
    withBoardState((state) => {
      state.showCards = !state.showCards;
    }, undefined, "presentation");
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
      turnCycle.action =
        hasPower(viewerPlayer(state), "ginny_weasley") && card.name === "protego"
          ? "stupefy"
          : card.name;
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
        turnCycle.action =
          turnCycle.cards.length === 1 &&
          hasPower(viewerPlayer(state), "ginny_weasley") &&
          card.name === "protego"
            ? "stupefy"
            : "discard";
      }

      if (
        turnCycle.cards.length === 2 &&
        turnCycle.cards.some((entry) => entry.name === "stupefy") &&
        turnCycle.cards.some((entry) => entry.name === "felix_felicis")
      ) {
        turnCycle.action = "felix";
      } else if (turnCycle.cards.length === 1) {
        turnCycle.action =
          hasPower(viewerPlayer(state), "ginny_weasley") &&
          turnCycle.cards[0]!.name === "protego"
            ? "stupefy"
            : turnCycle.cards[0]!.name;
      } else if (turnCycle.cards.length === 0) {
        state.turnCycle = cycleCleanse(turnCycle, state.players, state.turn);
      }

      return true;
    }

    if (turnCycle.phase === "fred-george-discard") {
      if (cardsInclude(turnCycle.cards, card)) {
        turnCycle.cards.splice(cardIndex(turnCycle.cards, card), 1);
      } else {
        turnCycle.cards = [card];
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

  function handleApparate(index: number) {
    withBoardState((state) => {
      if (state.turnCycle.action !== "apparate" || state.turnCycle.cards[0]?.name !== "apparate") {
        pushAlert("Select Apparate before choosing a new position.", "info");
        return true;
      }

      const afterPlayer = [...orderedPlayers.value];
      const thisPlayer = afterPlayer.splice(0, 1);
      const beforePlayer = afterPlayer.splice(0, index);
      const players = [...beforePlayer, ...thisPlayer, ...afterPlayer];
      const turnOrder = players.map((player) => player.id);
      const player = players.find((entry) => entry.id === state.playerId);

      if (!player) {
        return false;
      }

      const deck = new Deck([...state.deck.cards], [...state.deck.discards]);
      const selectedCard = state.turnCycle.cards[0];
      const selectedIndex = selectedCard ? player.hand.findIndex((card) => card.id === selectedCard.id) : -1;
      const [discardedCard] = selectedIndex === -1 ? [] : player.hand.splice(selectedIndex, 1);

      if (discardedCard) {
        deck.discards.unshift(discardedCard);
      }

      state.players = players;
      state.turnOrder = turnOrder;
      state.deck = deck;
      state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
      state.events = [
        {
          popup: {
            message: "You apparated to a new position in turn order.",
            options: [],
            popupType: "resolution",
          },
          bystanders: {
            message: `${getPrimaryCharacter(player)?.shortName || player.name} apparated to a new position in turn order.`,
            options: [],
            popupType: "resolution",
          },
          cardType: "resolution",
          target: [player.id],
        },
      ];
      return true;
    });
  }

  function handleHandClick(playerId: number, card: GameCard) {
    withBoardState((state) => {
      if (playerId !== state.playerId) {
        const handled = handleRuleHandClick(state, playerId, card);
        if (!handled.handled) {
          pushAlert(
            "This hand interaction is not available for the current card state.",
            "info"
          );
        }
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

      const handledRule = handleRuleTableauClick(state, playerId, card);
      if (handledRule.handled) {
        return true;
      }

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
        "This tableau interaction is not available for the current card state.",
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
          actionTargets.value.includes("tableau-empty")) &&
        state.turnCycle.cards[0]?.name !== "fiendfyre"
      ) {
        return placeSelectedCardOnTableau(state, playerId);
      }

      const handled = handleRuleCharacterClick(state, playerId, pushAlert);
      if (!handled.handled) {
        pushAlert(
          "Character targeting is not available for the current card state.",
          "info"
        );
      }
      return true;
    });
  }

  function handleTableClick(card: GameCard) {
    withBoardState((state) => {
      if (
        (state.turnCycle.phase === "selected" || state.turnCycle.phase === "fred-george-discard") &&
        state.turnCycle.action === "discard"
      ) {
        const fredDiscard = state.turnCycle.phase === "fred-george-discard";
        const discarded = discardSelectedCards(state);
        if (fredDiscard) {
          state.turnCycle.used.push("fred_and_george");
        }
        return discarded;
      }

      const handled = handleRuleTableClick(state, card, pushAlert);
      if (handled.handled) {
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

        if (
          hasPower(player, "cedric_diggory") &&
          !state.turnCycle.used.includes("cedric_bonus") &&
          drawnCard.house === "H" &&
          state.turnCycle.draw <= 1
        ) {
          state.turnCycle.draw += 1;
          state.turnCycle.used.push("cedric_bonus");
        }

        if (
          hasPower(player, "fred_and_george") &&
          state.turnCycle.draw === 0 &&
          !state.turnCycle.used.includes("fred_and_george")
        ) {
          state.turnCycle.phase = "fred-george-discard";
          state.turnCycle.action = "discard";
        }
        return true;
      }

      const handled = handleRuleDeckClick(state, pile, pushAlert);
      if (handled.handled) {
        return true;
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

  function chooseAction(action: string, index: number) {
    withBoardState((state) => {
      const handled = handleRulePopupChoice(state, action, index, pushAlert);
      if (!handled.handled) {
        pushAlert(
          "This action is not available for the current event state.",
          "info"
        );
      }
      return true;
    });
  }

  function usePowerAction(action: string) {
    withBoardState((state) => {
      const player = viewerPlayer(state);
      if (!player) {
        return false;
      }

      switch (action) {
        case "james_potter": {
          const character = getPrimaryCharacter(player);
          if (!character || state.turnCycle.used.includes("james_potter")) {
            return true;
          }

          if (character.health <= 1) {
            pushAlert("James needs more than 1 health to use this power safely.", "warning");
            return true;
          }

          character.health -= 1;
          const deck = new Deck([...state.deck.cards], [...state.deck.discards]);
          player.hand.unshift(...deck.drawCards(2));
          state.deck = deck;
          state.turnCycle.used.push("james_potter");
          return true;
        }
        case "dobby_stupefy":
        case "dobby_punish_stupefy":
        case "fenrir_stupefy":
        case "tonks_copy":
        case "molly_protego":
          state.turnCycle.phase = "selected";
          state.turnCycle.action = action;
          if (action.startsWith("dobby")) {
            state.turnCycle.used.push("dobby_stupefy");
          }
          return true;
        case "neville_longbottom": {
          const character = getPrimaryCharacter(player);
          if (!character || state.turnCycle.cards.length !== 2) {
            pushAlert("Select exactly two cards for Neville's power.", "info");
            return true;
          }

          if (character.health < character.maxHealth) {
            character.health += 1;
          }
          return discardSelectedCards(state);
        }
        case "minerva_mchonagall":
          if (state.turnCycle.cards.length !== 1 || !isGrayCard(state.turnCycle.cards[0]!)) {
            pushAlert("Select one gray card for McGonagall's power.", "info");
            return true;
          }

          discardSelectedCards(state);
          state.turnCycle.draw += 2;
          state.turnCycle.used.push("minerva_mchonagall");
          resetSelection(state);
          return true;
        default:
          return true;
      }
    });
  }

  function endTurn() {
    withBoardState((state) => {
      if (!canEndTurn.value) {
        pushAlert("You can only end your turn from the initial phase or after losing a turn in Azkaban.", "info");
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
    chooseAction,
    chooseCharacter,
    choosingCharacter,
    clearResolutionAction,
    endTurn,
    handleCharacterClick,
    handleDeckClick,
    handleHandClick,
    handleApparate,
    handleTableClick,
    handleTableauClick,
    isMyTurn,
    orderedPlayers,
    powerActions,
    removeAlert,
    resetBoard,
    toggleCards,
    usePowerAction,
    mutationNonce,
  };
}
