import type { BoardViewState, PlayerState } from "../../types";
import { getPrimaryCharacter } from "../core";
import { createResolutionEvent } from "../events";
import { hasPower, isMasterOfDeath } from "../powers";
import { drawCardsForPlayer } from "./shared";

function applyDamage(
  state: BoardViewState,
  target: PlayerState,
  amount: number,
  context: { attacker?: PlayerState | null; source?: string } = {},
) {
  const character = getPrimaryCharacter(target);

  if (!character || amount <= 0) {
    return false;
  }

  if (character.health === 1 && amount >= 1 && isMasterOfDeath(target)) {
    state.events.push(
      createResolutionEvent(
        "The Deathly Hallows protected your last life point.",
        [target.id],
        `${getPrimaryCharacter(target)?.shortName || target.name} was protected by the Deathly Hallows.`,
      ),
    );
    return false;
  }

  character.health -= amount;

  if (hasPower(target, "arthur_weasley")) {
    const [drawnCard] = drawCardsForPlayer(state, target, 1);
    if (drawnCard) {
      state.events.push(
        createResolutionEvent(
          "Arthur's power let you draw a card after taking damage.",
          [target.id],
          `${character.shortName} drew a card through Arthur Weasley's power.`,
        ),
      );
    }
  }

  if (
    context.source === "stupefy" &&
    hasPower(target, "draco_malfoy") &&
    context.attacker &&
    context.attacker.hand.length > 0
  ) {
    const stolenCard = context.attacker.hand.shift();
    if (stolenCard) {
      target.hand.unshift(stolenCard);
      state.events.push(
        createResolutionEvent(
          "Draco stole a card from the attacker.",
          [target.id],
          `${character.shortName} stole a card from ${getPrimaryCharacter(context.attacker)?.shortName || context.attacker.name} through Draco Malfoy's power.`,
        ),
      );
    }
  }

  return true;
}

export { applyDamage };
