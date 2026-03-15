import type { BoardViewState, GameCard } from "../../types";
import { cardIndex, titleCase } from "../core";
import { createResolutionEvent } from "../events";
import { cycleCleanse } from "../turn-cycle";
import {
  startMassEvent,
  startDiagonAlley,
  startSelfBuff,
  startThreeBroomsticks,
} from "./table-effects";
import { resolveAccio, resolveExpelliarmus, startFiendfyre } from "./actions";
import {
  clearCurrentEvent,
  cloneDeckState,
  type PushAlert,
  type RuleResult,
  viewerPlayer,
} from "./shared";

function handleRuleTableauClick(
  state: BoardViewState,
  targetPlayerId: number,
  card: GameCard,
): RuleResult {
  if (card.fileName === "" && state.turnCycle.cards[0]?.name === "fiendfyre") {
    return { handled: startFiendfyre(state, targetPlayerId) };
  }

  const targetPlayer = state.players.find((player) => player.id === targetPlayerId);
  if (!targetPlayer) {
    return { handled: false };
  }

  switch (state.turnCycle.action) {
    case "accio":
      return { handled: resolveAccio(state, targetPlayer, card) };
    case "expelliarmus":
      return { handled: resolveExpelliarmus(state, targetPlayer, card) };
    case "peter_pettigrew": {
      const player = viewerPlayer(state);
      if (!player) {
        return { handled: false };
      }

      const tableauIndex = cardIndex(targetPlayer.tableau, card);
      if (tableauIndex === -1) {
        return { handled: false };
      }

      const [stolenCard] = targetPlayer.tableau.splice(tableauIndex, 1);
      if (stolenCard) {
        player.hand.unshift(stolenCard);
      }

      state.turnCycle.draw = 0;
      state.turnCycle.phase = "initial";
      state.turnCycle.action = "";
      clearCurrentEvent(state);
      return { handled: true };
    }
    default:
      return { handled: false };
  }
}

function handleRuleTableClick(
  state: BoardViewState,
  card: GameCard,
  pushAlert: PushAlert,
): RuleResult {
  if (
    (state.turnCycle.phase === "ressurection_stone" ||
      state.turnCycle.phase === "resurrection_stone") &&
    card.fileName === ""
  ) {
    state.table = [...state.deck.discards];
    state.deck = {
      ...state.deck,
      discards: [],
    };
    state.turnCycle.phase = "ressurection_stone-discards";
    return { handled: true };
  }

  if (state.turnCycle.phase === "ressurection_stone-discards") {
    const player = viewerPlayer(state);
    if (!player) {
      return { handled: false };
    }

    const tableIndex = cardIndex(state.table, card);
    if (tableIndex === -1) {
      return { handled: false };
    }

    const [resurrectedCard] = state.table.splice(tableIndex, 1);
    if (resurrectedCard) {
      player.hand.unshift(resurrectedCard);
    }

    const deck = cloneDeckState(state);
    deck.serveCards(state.table.splice(0));
    state.deck = deck;
    state.events.push(
      createResolutionEvent(
        `You took a ${titleCase(card.name.replaceAll("_", " "))} from the discard.`,
        [player.id],
        "A card was resurrected from the discard with the Resurrection Stone.",
      ),
    );
    state.turnCycle.used.push("ressurection_stone");
    state.turnCycle.draw = Math.max(0, state.turnCycle.draw - 1);
    state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
    return { handled: true };
  }

  if (state.turnCycle.phase === "diagon_alley") {
    const player = viewerPlayer(state);
    if (!player) {
      return { handled: false };
    }

    const tableIndex = cardIndex(state.table, card);
    if (tableIndex === -1) {
      return { handled: false };
    }

    const [drawnCard] = state.table.splice(tableIndex, 1);
    if (drawnCard) {
      player.hand.unshift(drawnCard);
    }

    clearCurrentEvent(state);
    if (state.events.length === 0) {
      state.events.unshift(
        createResolutionEvent(
          "All players have taken their cards from Diagon Alley!",
          [player.id],
          "All players have taken their cards from Diagon Alley!",
        ),
      );
      state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
    }

    return { handled: true };
  }

  if (card.fileName !== "") {
    return { handled: false };
  }

  switch (state.turnCycle.action) {
    case "dementors":
      return { handled: startMassEvent(state, "dementors") };
    case "garroting_gas":
      return { handled: startMassEvent(state, "garroting_gas") };
    case "diagon_alley":
      return { handled: startDiagonAlley(state) };
    case "honeydukes":
      return {
        handled: startSelfBuff(
          state,
          2,
          "You have played Honeydukes and get to draw two more cards.",
        ),
      };
    case "weasleys_wizard_weezes":
      return {
        handled: startSelfBuff(
          state,
          3,
          "You have played Weasleys' Wizard Weezes and get to draw three more cards.",
        ),
      };
    case "three_broomsticks":
      return { handled: startThreeBroomsticks(state) };
    case "ron_weasley": {
      const player = viewerPlayer(state);
      if (!player) {
        return { handled: false };
      }

      const deck = cloneDeckState(state);
      const [drawnCard] = deck.drawCards(1, true);
      state.deck = deck;
      if (drawnCard) {
        player.hand.unshift(drawnCard);
      }
      state.turnCycle.draw = Math.max(0, state.turnCycle.draw - 1);
      clearCurrentEvent(state);
      state.turnCycle.phase = "initial";
      state.turnCycle.action = "";
      return { handled: true };
    }
    default:
      pushAlert("This table interaction is still pending a later rule port.", "info");
      return { handled: true };
  }
}

export { handleRuleTableClick, handleRuleTableauClick };
