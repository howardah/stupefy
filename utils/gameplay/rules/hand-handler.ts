import type { BoardViewState, GameCard } from "../../types";
import { cardIndex } from "../core";
import {
  resolveAccio,
  resolveExpelliarmus,
} from "./actions";
import {
  clearCurrentEvent,
  getPlayerById,
  type RuleResult,
  viewerPlayer,
} from "./shared";

function handleRuleHandClick(
  state: BoardViewState,
  targetPlayerId: number,
  card: GameCard,
): RuleResult {
  const targetPlayer = getPlayerById(state, targetPlayerId);
  if (!targetPlayer) {
    return { handled: false };
  }

  switch (state.turnCycle.action) {
    case "accio":
      return { handled: resolveAccio(state, targetPlayer, card) };
    case "expelliarmus":
      return { handled: resolveExpelliarmus(state, targetPlayer, card) };
    case "peeves_draw": {
      const player = viewerPlayer(state);
      if (!player) {
        return { handled: false };
      }

      const handIndex = cardIndex(targetPlayer.hand, card);
      if (handIndex === -1) {
        return { handled: false };
      }

      const [stolenCard] = targetPlayer.hand.splice(handIndex, 1);
      if (stolenCard) {
        player.hand.unshift(stolenCard);
      }

      state.turnCycle.draw = Math.max(0, state.turnCycle.draw - 1);
      state.turnCycle.phase = "initial";
      state.turnCycle.action = "";
      clearCurrentEvent(state);
      return { handled: true };
    }
    default:
      return { handled: false };
  }
}

export { handleRuleHandClick };
