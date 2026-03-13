import type { ComputedRef } from "vue";
import type { BoardViewState, GameCard } from "~/utils/types";
import Deck from "~/utils/deck";
import {
  handleRuleCharacterClick,
  handleRuleDeckClick,
  handleRuleHandClick,
  handleRuleTableClick,
  handleRuleTableauClick,
} from "~/utils/gameplay/card-rules";
import { cardIndex, cardsInclude, getPrimaryCharacter } from "~/utils/gameplay/core";
import { hasPower } from "~/utils/gameplay/powers";
import { cycleCleanse } from "~/utils/gameplay/turn-cycle";
import {
  activePlayer,
  viewerPlayer,
} from "./helpers";
import type { useBoardSelections } from "./useBoardSelections";

type WithBoardState = (
  action: (state: BoardViewState) => void | boolean | BoardViewState,
  fallbackMessage?: string,
  kind?: "gameplay" | "presentation",
) => void;

function useBoardInteractions(options: {
  actionTargets: ComputedRef<string[]>;
  orderedPlayers: ComputedRef<BoardViewState["players"]>;
  pushAlert: (message: string, tone?: "info" | "warning" | "error") => void;
  selections: ReturnType<typeof useBoardSelections>;
  withBoardState: WithBoardState;
}) {
  const { actionTargets, orderedPlayers, pushAlert, selections, withBoardState } = options;

  function toggleCards() {
    withBoardState((state) => {
      state.showCards = !state.showCards;
    }, undefined, "presentation");
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
          pushAlert("This hand interaction is not available for the current card state.", "info");
        }
        return true;
      }

      if (!selections.selectOwnHandCard(state, card)) {
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
        return selections.placeSelectedCardOnTableau(state, playerId);
      }

      pushAlert("This tableau interaction is not available for the current card state.", "info");
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
        return selections.placeSelectedCardOnTableau(state, playerId);
      }

      const handled = handleRuleCharacterClick(state, playerId, pushAlert);
      if (!handled.handled) {
        pushAlert("Character targeting is not available for the current card state.", "info");
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
        const discarded = selections.discardSelectedCards(state);
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

      if (pile === "discard" && state.turnCycle.phase === "selected-stuck-in-azkaban") {
        return selections.discardSelectedCards(state);
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

      pushAlert(`The ${pile} pile click path still needs the legacy rule handlers for this phase.`, "info");
      return true;
    });
  }

  return {
    handleApparate,
    handleCharacterClick,
    handleDeckClick,
    handleHandClick,
    handleTableClick,
    handleTableauClick,
    toggleCards,
  };
}

export { useBoardInteractions };
