import type { BoardViewState, CharacterPowerName } from "../../types";
import { isCharacterPowerName } from "../../types";
import { cardIndex, getPrimaryCharacter } from "../core";
import { createResolutionEvent } from "../events";
import { cycleCleanse } from "../turn-cycle";
import {
  startFelixSelection,
  startFiendfyre,
  startFreeStupefy,
  startStupefy,
  startWizardsDuel,
} from "./actions";
import { applyAdvancedDeaths } from "./death";
import {
  clearCurrentEvent,
  discardSelected,
  getCurrentEvent,
  getPlayerById,
  maybeRewardHermione,
  maybeTriggerLockhart,
  resetTurnSelection,
  restoreTurnCycleAfterDeath,
  type PushAlert,
  type RuleResult,
  viewerPlayer,
} from "./shared";

function handleRuleCharacterClick(
  state: BoardViewState,
  targetPlayerId: number,
  pushAlert: PushAlert,
): RuleResult {
  const currentEvent = getCurrentEvent(state);
  const targetPlayer = getPlayerById(state, targetPlayerId);

  if (!targetPlayer) {
    return { handled: false };
  }

  if (
    state.turnCycle.phase === "death" &&
    currentEvent?.cardType === "molly_weasley" &&
    currentEvent.target.includes(state.playerId)
  ) {
    const molly = viewerPlayer(state);
    if (!molly || molly.id === targetPlayer.id) {
      return { handled: true };
    }

    targetPlayer.hand.unshift(...molly.hand.splice(0));
    clearCurrentEvent(state);
    applyAdvancedDeaths(state, "molly-skip");
    restoreTurnCycleAfterDeath(state);
    return { handled: true };
  }

  switch (state.turnCycle.action) {
    case "butterbeer": {
      const discarded = discardSelected(state);

      if (!discarded) {
        return { handled: false };
      }

      const character = getPrimaryCharacter(targetPlayer);
      if (!character || character.health >= character.maxHealth) {
        pushAlert("This player is already at max health.", "info");
        return { handled: true };
      }

      character.health += 1;
      if (targetPlayer.power.includes("rubeus_hagrid") && character.health < character.maxHealth) {
        character.health += 1;
      }

      state.deck = discarded.deck;
      state.events.push(
        createResolutionEvent(
          "You drank butterbeer and were healed for 1 point!",
          [targetPlayer.id],
          `${character.shortName} drank butterbeer and was healed for 1 point!`,
        ),
      );
      state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
      return { handled: true };
    }
    case "stupefy":
      return { handled: startStupefy(state, targetPlayer) };
    case "dobby_stupefy":
      return { handled: startFreeStupefy(state, targetPlayer) };
    case "dobby_punish_stupefy":
      return { handled: startFreeStupefy(state, targetPlayer, true) };
    case "fenrir_stupefy":
      return { handled: startStupefy(state, targetPlayer) };
    case "wizards_duel":
      return { handled: startWizardsDuel(state, targetPlayer) };
    case "felix":
      return { handled: startFelixSelection(state, targetPlayer, pushAlert) };
    case "fiendfyre":
      return { handled: startFiendfyre(state, targetPlayer.id) };
    case "tonks_copy": {
      const player = viewerPlayer(state);
      const copiedCharacter = getPrimaryCharacter(targetPlayer);

      if (
        !player ||
        targetPlayer.id === player.id ||
        !copiedCharacter ||
        copiedCharacter.fileName === "mad-eye_moody"
      ) {
        return { handled: true };
      }

      const copiedPowers: CharacterPowerName[] = [];
      const currentPower = getPrimaryCharacter(player)?.fileName;

      if (isCharacterPowerName(currentPower)) {
        copiedPowers.push(currentPower);
      } else {
        copiedPowers.push("nymphadora_tonks");
      }

      if (isCharacterPowerName(copiedCharacter.fileName)) {
        copiedPowers.push(copiedCharacter.fileName);
      }

      player.power = copiedPowers;
      state.turnCycle.used.push("tonks_copy");
      resetTurnSelection(state);
      state.events.push(
        createResolutionEvent(
          `You copied ${copiedCharacter.shortName}'s power.`,
          [player.id],
          `${getPrimaryCharacter(player)?.shortName || player.name} copied ${copiedCharacter.shortName}'s power for the round.`,
        ),
      );
      return { handled: true };
    }
    case "molly_protego": {
      const molly = viewerPlayer(state);
      const selectedCard = state.turnCycle.cards[0];

      if (!molly || !selectedCard || selectedCard.name !== "protego") {
        return { handled: false };
      }

      const selectedIndex = cardIndex(molly.hand, selectedCard);
      if (selectedIndex === -1) {
        return { handled: false };
      }

      const [giftedCard] = molly.hand.splice(selectedIndex, 1);
      if (giftedCard) {
        targetPlayer.hand.unshift(giftedCard);
      }

      resetTurnSelection(state);
      state.events.push(
        createResolutionEvent(
          "You gave a Protego card away.",
          [molly.id],
          `${getPrimaryCharacter(molly)?.shortName || molly.name} gave a Protego card to ${getPrimaryCharacter(targetPlayer)?.shortName || targetPlayer.name}.`,
        ),
      );
      maybeRewardHermione(state, molly);
      maybeTriggerLockhart(state, molly);
      return { handled: true };
    }
    default:
      return { handled: false };
  }
}

export { handleRuleCharacterClick };
