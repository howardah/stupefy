import type { ComputedRef } from "vue";
import type { BoardViewState, CharacterCard } from "~/utils/types";
import { isCharacterPowerName } from "~/utils/types";
import Deck from "~/utils/deck";
import { handleRulePopupChoice } from "~/utils/gameplay/card-rules";
import { getPrimaryCharacter } from "~/utils/gameplay/core";
import { isGrayCard } from "~/utils/gameplay/powers";
import { endTurnState, incrementTurn, setupTurnCycleForTurn } from "~/utils/gameplay/turn-cycle";
import { activePlayer, resetSelection, viewerPlayer } from "./helpers";
import type { useBoardSelections } from "./useBoardSelections";

type WithBoardState = (
  action: (state: BoardViewState) => void | boolean | BoardViewState,
  fallbackMessage?: string,
  kind?: "gameplay" | "presentation",
) => void;

function useBoardTurnActions(options: {
  boardState: ComputedRef<BoardViewState | null>;
  canEndTurn: ComputedRef<boolean>;
  pushAlert: (message: string, tone?: "info" | "warning" | "error") => void;
  selections: ReturnType<typeof useBoardSelections>;
  withBoardState: WithBoardState;
}) {
  const { canEndTurn, pushAlert, selections, withBoardState } = options;

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
      player.power = isCharacterPowerName(nextCharacter.fileName) ? [nextCharacter.fileName] : [];
      player.hand = deck.drawCards(nextCharacter.health);
      state.deck = deck;

      if (!state.players.some((entry) => Array.isArray(entry.character))) {
        const setup = setupTurnCycleForTurn(state.players, state.turn);
        state.turnCycle = setup.turnCycle;
        state.events = setup.events ?? [];
      }
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
        pushAlert("This action is not available for the current event state.", "info");
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
          return selections.discardSelectedCards(state);
        }
        case "minerva_mchonagall":
          if (state.turnCycle.cards.length !== 1 || !isGrayCard(state.turnCycle.cards[0]!)) {
            pushAlert("Select one gray card for McGonagall's power.", "info");
            return true;
          }

          selections.discardSelectedCards(state);
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
        pushAlert(
          "You can only end your turn from the initial phase or after losing a turn in Azkaban.",
          "info",
        );
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
        nextPlayer.power =
          character?.fileName && isCharacterPowerName(character.fileName)
            ? [character.fileName]
            : [];
      }

      const setup = setupTurnCycleForTurn(state.players, nextTurn);
      state.turnCycle = setup.turnCycle;
      state.events = setup.events ?? [];
      return true;
    });
  }

  return {
    chooseAction,
    chooseCharacter,
    clearResolutionAction,
    endTurn,
    usePowerAction,
  };
}

export { useBoardTurnActions };
