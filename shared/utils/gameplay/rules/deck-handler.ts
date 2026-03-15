import type { BoardViewState } from "../../types";
import { cardsIndexName, getPrimaryCharacter } from "../core";
import { createResolutionEvent } from "../events";
import { cycleCleanse } from "../turn-cycle";
import {
  checkTopCardForHouses,
  clearCurrentEvent,
  cloneDeckState,
  determineHouse,
  type PushAlert,
  type RuleResult,
  viewerPlayer,
} from "./shared";

function handleRuleDeckClick(
  state: BoardViewState,
  pile: "draw" | "discard",
  pushAlert: PushAlert,
): RuleResult {
  if (pile === "discard" && state.turnCycle.phase === "selected") {
    state.events.push({
      popup: {
        popupType: "subtle",
        message:
          state.turnCycle.cards.length > 1
            ? "Are you sure you want to discard these cards?"
            : "Are you sure you want to discard this card?",
        options: [
          { label: "yes", function: "dump" },
          { label: "no", function: "clear" },
        ],
      },
      instigator: viewerPlayer(state) ?? undefined,
      cardType: "discard",
      target: [state.playerId],
    });
    state.turnCycle.phase = "discard";
    state.turnCycle.action = "discardEvent";
    return { handled: true };
  }

  if (pile === "draw" && state.turnCycle.phase === "azkaban") {
    const player = viewerPlayer(state);
    if (!player) {
      return { handled: false };
    }

    const result = checkTopCardForHouses(state, [determineHouse(player, state)]);
    state.deck = result.deck;
    clearCurrentEvent(state);

    if (result.gotIt) {
      const azkabanIndex = cardsIndexName(player.tableau, "azkaban");
      const [azkabanCard] = azkabanIndex === -1 ? [] : player.tableau.splice(azkabanIndex, 1);
      if (azkabanCard) {
        const deck = cloneDeckState(state);
        deck.serveCard(azkabanCard);
        state.deck = deck;
      }

      state.events.push(
        createResolutionEvent(
          `Hooray! You drew a ${result.house} and escaped Azkaban.`,
          [player.id],
          `${getPrimaryCharacter(player)?.shortName || player.name} drew a ${result.house} and escaped Azkaban.`,
        ),
      );
      state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
      return { handled: true };
    }

    state.events.push(
      createResolutionEvent(
        `Bummer! You drew a ${result.house} and are still in Azkaban. You've lost this turn.`,
        [player.id],
        `${getPrimaryCharacter(player)?.shortName || player.name} failed to escape Azkaban and their turn has been skipped.`,
      ),
    );
    state.turnCycle.phase = "stuck-in-azkaban";
    pushAlert("You failed to escape Azkaban and have lost this turn.", "warning");
    return { handled: true };
  }

  return { handled: false };
}

export { handleRuleDeckClick };
