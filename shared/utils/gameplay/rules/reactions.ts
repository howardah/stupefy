import type { BoardViewState, GameCard, PlayerState } from "../../types";
import { getPrimaryCharacter } from "../core";
import { createResolutionEvent } from "../events";
import { hasPower } from "../powers";
import { applyDamage } from "./damage";
import {
  checkTopCardForHouses,
  cloneDeckState,
  determineHouse,
  discardCards,
  ensureReactionState,
  getCurrentEvent,
  maybeRewardHermione,
  maybeTriggerLockhart,
  type PushAlert,
  viewerPlayer,
} from "./shared";

function isProtegoCard(player: PlayerState, cardName: string) {
  const character = getPrimaryCharacter(player)?.fileName;

  switch (character) {
    case "luna_lovegood":
      return true;
    case "ginny_weasley":
      return cardName === "stupefy" || cardName === "protego";
    default:
      return cardName === "protego";
  }
}

function isStupefyCard(player: PlayerState, cards: GameCard[]) {
  const character = getPrimaryCharacter(player)?.fileName;

  if (cards.length !== 1) {
    return false;
  }

  if (character === "ginny_weasley") {
    return cards[0]?.name === "stupefy" || cards[0]?.name === "protego";
  }

  return cards[0]?.name === "stupefy";
}

function resolveProtectionChoice(
  state: BoardViewState,
  action: string,
  actionIndex: number,
  pushAlert: PushAlert,
) {
  const player = viewerPlayer(state);
  const event = getCurrentEvent(state);

  if (!player || !event) {
    return false;
  }

  const reaction = ensureReactionState(state, state.playerId);
  reaction.choice = action;

  switch (action) {
    case "takeHit": {
      applyDamage(state, player, 1, {
        attacker: event.instigator as typeof player | undefined,
        source: state.turnCycle.action,
      });
      return true;
    }
    case "playProtego": {
      if (reaction.cards.length === 0) {
        pushAlert("Choose a Protego card first.", "info");
        return false;
      }

      const requiredCards = hasPower(
        event.instigator as typeof player | undefined,
        "bellatrix_lestrange",
      )
        ? 2
        : 1;

      if (reaction.cards.length !== requiredCards) {
        pushAlert(
          requiredCards === 2
            ? "Bellatrix's Stupefy needs two Protego cards to block."
            : "Choose exactly one Protego card.",
          "warning",
        );
        return false;
      }

      if (!reaction.cards.every((card) => isProtegoCard(player, card.name))) {
        pushAlert("You must choose cards that work as Protego charms.", "warning");
        return false;
      }

      const deck = cloneDeckState(state);
      discardCards(player, deck, reaction.cards);
      state.deck = deck;
      reaction.cards = [];
      maybeRewardHermione(state, player);
      maybeTriggerLockhart(state, player);
      return true;
    }
    case "playStupefy": {
      if (!isStupefyCard(player, reaction.cards)) {
        pushAlert("You must choose exactly one Stupefy card.", "warning");
        return false;
      }

      const deck = cloneDeckState(state);
      discardCards(player, deck, reaction.cards);
      state.deck = deck;
      reaction.cards = [];
      maybeRewardHermione(state, player);
      maybeTriggerLockhart(state, player);
      return true;
    }
    case "houseHide":
    case "invisibilityHide": {
      const allowedHouses =
        action === "invisibilityHide"
          ? ["H", "S", "G", "R"].filter((house) => house !== determineHouse(player, state))
          : [determineHouse(player, state)];
      const result = checkTopCardForHouses(state, allowedHouses);

      state.deck = result.deck;

      if (result.gotIt) {
        pushAlert(`Hooray! You drew a ${result.house}, and the spell missed.`, "info");
        return true;
      }

      const options = event.popup?.options ?? [];
      options.splice(actionIndex, 1);
      pushAlert(`Bummer! You drew a ${result.house}.`, "warning");
      return false;
    }
    case "clearEvent":
      return true;
    default:
      return false;
  }
}

function resolveStupefyResolution(state: BoardViewState, lastAction: string) {
  const instigator = state.players.find((player) => player.id === state.turn);
  const subject = state.players.find((player) => player.id === state.turnCycle.hotseat);

  if (!instigator || !subject) {
    return null;
  }

  const instigatorName = getPrimaryCharacter(instigator)?.shortName || instigator.name;
  const subjectName = getPrimaryCharacter(subject)?.shortName || subject.name;

  switch (lastAction) {
    case "houseHide":
      return createResolutionEvent(
        "You have successfully hidden and the spell missed.",
        [subject.id],
        `${subjectName} hid in a vanishing cabinet and ${instigatorName}'s Stupefy missed.`,
      );
    case "takeHit":
      return createResolutionEvent(
        "You have taken a hit!",
        [subject.id],
        `${subjectName} was hit by ${instigatorName}'s Stupefy.`,
      );
    case "playProtego":
      return createResolutionEvent(
        "You have successfully cast Protego.",
        [subject.id],
        `${subjectName} used Protego and blocked ${instigatorName}'s Stupefy.`,
      );
    case "invisibilityHide":
      return createResolutionEvent(
        "You have successfully hidden and the spell missed.",
        [subject.id],
        `${subjectName} hid in an invisibility cloak and ${instigatorName}'s Stupefy missed.`,
      );
    case "clearEvent":
      return createResolutionEvent(
        "The spell missed.",
        [subject.id],
        `${subjectName} is untouchable and ${instigatorName}'s Stupefy missed.`,
      );
    default:
      return null;
  }
}

export { isProtegoCard, isStupefyCard, resolveProtectionChoice, resolveStupefyResolution };
