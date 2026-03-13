import type { BoardViewState, GameEvent, GameEventBystanderKey } from "../../types";
import { toTurnActionName } from "../../types";
import { cardIndex, cardsIndexName, getPrimaryCharacter } from "../core";
import { createResolutionEvent } from "../events";
import { cycleCleanse, incrementTurn } from "../turn-cycle";
import { applyDamage } from "./damage";
import { applyAdvancedDeaths, resolveDeathChoice } from "./death";
import {
  checkTopCardForHouses,
  clearCurrentEvent,
  cloneDeckState,
  createBystanderPopup,
  determineHouse,
  discardCards,
  ensureReactionState,
  finishEventForPlayer,
  getCurrentEvent,
  getPlayerById,
  maybeRewardHermione,
  maybeTriggerLockhart,
  type PushAlert,
  type RuleResult,
  viewerPlayer,
} from "./shared";
import {
  isStupefyCard,
  resolveProtectionChoice,
  resolveStupefyResolution,
} from "./reactions";
import { handleRuleTableClick } from "./table-handler";

function handleStartTurnChoice(
  state: BoardViewState,
  action: string,
  pushAlert: PushAlert,
): RuleResult | null {
  if (state.turnCycle.phase !== "start-turn") {
    return null;
  }

  if (action === "start_no") {
    clearCurrentEvent(state);
    state.turnCycle.phase = "initial";
    state.turnCycle.action = "";
    return { handled: true };
  }

  if (action !== "start_yes") {
    return { handled: false };
  }

  clearCurrentEvent(state);

  if (state.turnCycle.action === "ron_weasley") {
    return handleRuleTableClick(
      state,
      { fileName: "", house: "", name: "", power: {} },
      pushAlert,
    );
  }

  state.turnCycle.phase = "selected";
  return { handled: true };
}

function handleDiscardChoice(state: BoardViewState, action: string): RuleResult | null {
  const player = viewerPlayer(state);

  if (state.turnCycle.action !== "discardEvent" || !player) {
    return null;
  }

  if (action === "dump") {
    const deck = cloneDeckState(state);
    discardCards(player, deck, state.turnCycle.cards);
    state.deck = deck;
    clearCurrentEvent(state);
    state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
    return { handled: true };
  }

  if (action !== "clear") {
    return { handled: false };
  }

  clearCurrentEvent(state);
  state.turnCycle.phase = "selected";
  if (state.turnCycle.cards.length === 1) {
    state.turnCycle.action = toTurnActionName(state.turnCycle.cards[0]!.name, "discard");
  } else if (
    state.turnCycle.cards.length === 2 &&
    state.turnCycle.cards.some((card) => card.name === "stupefy") &&
    state.turnCycle.cards.some((card) => card.name === "felix_felicis")
  ) {
    state.turnCycle.action = "felix";
  } else {
    state.turnCycle.action = "discard";
  }
  return { handled: true };
}

function handleWizardsDuelChoice(
  state: BoardViewState,
  action: string,
  pushAlert: PushAlert,
): RuleResult {
  const event = getCurrentEvent(state);
  const player = viewerPlayer(state);

  if (!event || !player) {
    return { handled: false };
  }

  const reaction = ensureReactionState(state, state.playerId);

  if (action === "takeHit") {
    applyDamage(state, player, 1, {
      attacker: event.instigator ? getPlayerById(state, event.instigator.id) : null,
      source: "wizards_duel",
    });
    applyAdvancedDeaths(state);
    if (isDeathPhase(state)) {
      return { handled: true };
    }
    const instigator = event.instigator ? getPlayerById(state, event.instigator.id) : null;
    const loser =
      typeof event.target[0] === "number" ? getPlayerById(state, event.target[0]) : null;
    clearCurrentEvent(state);
    if (instigator && loser) {
      state.events.unshift(
        createResolutionEvent(
          `You beat ${getPrimaryCharacter(loser)?.shortName || loser.name} in a Wizard's Duel.`,
          [instigator.id],
          `${getPrimaryCharacter(instigator)?.shortName || instigator.name} beat ${getPrimaryCharacter(loser)?.shortName || loser.name} in a Wizard's Duel.`,
        ),
      );
    }
    state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
    return { handled: true };
  }

  if (action !== "duel") {
    return { handled: false };
  }

  if (!isStupefyCard(player, reaction.cards)) {
    pushAlert("You must choose exactly one Stupefy card.", "warning");
    return { handled: true };
  }

  const deck = cloneDeckState(state);
  discardCards(player, deck, reaction.cards);
  state.deck = deck;
  reaction.cards = [];
  maybeRewardHermione(state, player);
  maybeTriggerLockhart(state, player);

  const defender = event.instigator ? getPlayerById(state, event.instigator.id) : null;
  if (!defender) {
    return { handled: false };
  }

  clearCurrentEvent(state);
  const bystanderKey: GameEventBystanderKey = `bystanders-${player.id}`;
  const duelEvent: GameEvent = {
    popup: {
      message: `${getPrimaryCharacter(player)?.shortName || player.name} has cast a Stupefy back at you!`,
      options: [
        { label: "Take a hit", function: "takeHit" },
        { label: "Play Stupefy", function: "duel" },
      ],
    },
    bystanders: createBystanderPopup(
      `${getPrimaryCharacter(player)?.shortName || player.name} and ${getPrimaryCharacter(defender)?.shortName || defender.name} are fighting a Wizard's Duel!`,
      "subtle",
    ),
    instigator: player,
    cardType: "wizards_duel",
    target: [defender.id],
  };
  duelEvent[bystanderKey] = createBystanderPopup(
    `You've cast a Stupefy at ${getPrimaryCharacter(defender)?.shortName || defender.name}!`,
    "subtle",
  );
  state.events.push(duelEvent);
  return { handled: true };
}

function handleFelixChoice(state: BoardViewState, action: string, pushAlert: PushAlert): RuleResult {
  const instigator = state.players.find((player) => player.id === state.turn);
  if (!instigator) {
    return { handled: false };
  }

  if (action === "cancel") {
    clearCurrentEvent(state);
    state.turnCycle.phase = "selected";
    state.turnCycle.felix = [];
    return { handled: true };
  }

  if (action !== "shoot") {
    return { handled: false };
  }

  if (state.turnCycle.felix.length === 0) {
    pushAlert("Choose at least one player before using Felix Felicis.", "warning");
    return { handled: true };
  }

  const deck = cloneDeckState(state);
  const targets =
    state.turnCycle.felix.length === 2
      ? [state.turnCycle.felix[0], state.turnCycle.felix[1]]
      : [state.turnCycle.felix[0], state.turnCycle.felix[0]];

  for (const target of targets) {
    if (target && getPrimaryCharacter(target)) {
      applyDamage(state, target, 1, { attacker: instigator, source: "stupefy" });
    }
  }

  for (const selectedCard of state.turnCycle.cards) {
    const handIndex = cardIndex(instigator.hand, selectedCard);
    if (handIndex === -1) {
      continue;
    }

    const [discardedCard] = instigator.hand.splice(handIndex, 1);
    if (discardedCard && discardedCard.name !== "felix_felicis") {
      deck.serveCard(discardedCard);
    }
  }

  clearCurrentEvent(state);
  applyAdvancedDeaths(state);
  state.deck = deck;
  state.events.unshift(
    createResolutionEvent(
      state.turnCycle.felix.length === 2
        ? `${getPrimaryCharacter(state.turnCycle.felix[0]!)?.shortName || ""} and ${getPrimaryCharacter(state.turnCycle.felix[1]!)?.shortName || ""} were both shot by Felix-fortified Stupefy.`
        : `${getPrimaryCharacter(state.turnCycle.felix[0]!)?.shortName || ""} was shot by Felix-fortified Stupefy.`,
      [instigator.id],
      state.turnCycle.felix.length === 2
        ? `${getPrimaryCharacter(state.turnCycle.felix[0]!)?.shortName || ""} and ${getPrimaryCharacter(state.turnCycle.felix[1]!)?.shortName || ""} were both shot by ${getPrimaryCharacter(instigator)?.shortName || instigator.name}'s Felix-fortified Stupefy.`
        : `${getPrimaryCharacter(state.turnCycle.felix[0]!)?.shortName || ""} was shot by ${getPrimaryCharacter(instigator)?.shortName || instigator.name}'s Felix-fortified Stupefy.`,
    ),
  );
  state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
  return { handled: true };
}

function handleFiendfyreChoice(state: BoardViewState, action: string): RuleResult {
  const event = getCurrentEvent(state);
  const player = viewerPlayer(state);

  if (!event || !player || action !== "draw") {
    return { handled: false };
  }

  const result = checkTopCardForHouses(state, [determineHouse(player, state)]);
  state.deck = result.deck;
  clearCurrentEvent(state);

  const burningPlayer = getPlayerById(state, state.turnCycle.hotseat);
  const instigator = event.instigator ? getPlayerById(state, event.instigator.id) : null;

  if (!burningPlayer || !instigator) {
    return { handled: false };
  }

  const fireIndex = cardsIndexName(burningPlayer.tableau, "fiendfyre");
  const [fireCard] = fireIndex === -1 ? [] : burningPlayer.tableau.splice(fireIndex, 1);

  if (result.gotIt) {
    if (fireCard) {
      const deck = cloneDeckState(state);
      deck.serveCard(fireCard);
      state.deck = deck;
    }

    state.events.push(
      createResolutionEvent(
        "You have extinguished the Fiendfyre!",
        [burningPlayer.id],
        `${getPrimaryCharacter(burningPlayer)?.shortName || burningPlayer.name} extinguished the Fiendfyre!`,
      ),
    );
    state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
    return { handled: true };
  }

  if (getPrimaryCharacter(burningPlayer)) {
    applyDamage(state, burningPlayer, 1, { attacker: instigator, source: "fiendfyre" });
  }

  const nextTargetId = incrementTurn(burningPlayer.id, state.turnOrder, state.deadPlayers);
  const nextTarget = getPlayerById(state, nextTargetId);
  if (nextTarget && fireCard) {
    nextTarget.tableau.push(fireCard);
  }

  state.turnCycle.hotseat = nextTargetId;
  state.events.push({
    popup: {
      message: `${getPrimaryCharacter(instigator)?.shortName || instigator.name} cast Fiendfyre and ${getPrimaryCharacter(burningPlayer)?.shortName || burningPlayer.name} was burnt! Draw a card to see if you can extinguish it.`,
      options: [{ label: "Draw Card", function: "draw" }],
    },
    bystanders: createBystanderPopup(
      `${getPrimaryCharacter(instigator)?.shortName || instigator.name} cast Fiendfyre and ${getPrimaryCharacter(burningPlayer)?.shortName || burningPlayer.name} has been burnt! ${getPrimaryCharacter(nextTarget!)?.shortName || nextTarget?.name || "The next player"} must now draw to try to get past.`,
      "subtle",
    ),
    instigator,
    cardType: "fiendfyre",
    target: nextTarget ? [nextTarget.id] : [],
  });
  applyAdvancedDeaths(state);
  return { handled: true };
}

function handleRulePopupChoice(
  state: BoardViewState,
  action: string,
  actionIndex: number,
  pushAlert: PushAlert,
): RuleResult {
  const event = getCurrentEvent(state);
  const player = viewerPlayer(state);

  if (!event || !player) {
    return { handled: false };
  }

  const reaction = ensureReactionState(state, state.playerId);
  reaction.choice = action;

  if (isDeathPhase(state)) {
    return resolveDeathChoice(state, action);
  }

  const startTurnResult = handleStartTurnChoice(state, action, pushAlert);
  if (startTurnResult) {
    return startTurnResult;
  }

  const discardResult = handleDiscardChoice(state, action);
  if (discardResult) {
    return discardResult;
  }

  switch (state.turnCycle.action) {
    case "stupefy": {
      const resolved = resolveProtectionChoice(state, action, actionIndex, pushAlert);
      if (!resolved) {
        return { handled: action === "takeHit" };
      }

      applyAdvancedDeaths(state);
      if (isDeathPhase(state)) {
        return { handled: true };
      }
      finishEventForPlayer(state, resolveStupefyResolution(state, action));
      return { handled: true };
    }
    case "garroting_gas":
    case "dementors": {
      const resolved = resolveProtectionChoice(state, action, actionIndex, pushAlert);
      if (!resolved) {
        return { handled: action === "takeHit" };
      }

      applyAdvancedDeaths(state);
      if (isDeathPhase(state)) {
        return { handled: true };
      }
      finishEventForPlayer(
        state,
        null,
        state.turnCycle.action === "garroting_gas"
          ? "The gas is cleared."
          : "The Dementors have passed.",
      );
      return { handled: true };
    }
    case "wizards_duel":
      return handleWizardsDuelChoice(state, action, pushAlert);
    case "felix":
      return handleFelixChoice(state, action, pushAlert);
    case "fiendfyre":
      return handleFiendfyreChoice(state, action);
    default:
      return { handled: false };
  }
}

export { handleRulePopupChoice };

function isDeathPhase(state: BoardViewState) {
  return state.turnCycle.phase === "death";
}
