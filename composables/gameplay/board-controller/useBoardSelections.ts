import type { BoardViewState, GameCard } from "~/utils/types";
import Deck from "~/utils/deck";
import { cardIndex, cardsInclude } from "~/utils/gameplay/core";
import { tableauProblems } from "~/utils/gameplay/events";
import { hasPower } from "~/utils/gameplay/powers";
import { cycleCleanse } from "~/utils/gameplay/turn-cycle";
import {
  cloneSelectedCards,
  ensureTurnCyclePlayerState,
  viewerPlayer,
} from "./helpers";

function useBoardSelections(pushAlert: (message: string, tone?: "info" | "warning" | "error") => void) {
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

  return {
    discardSelectedCards,
    placeSelectedCardOnTableau,
    selectOwnHandCard,
  };
}

export { useBoardSelections };
