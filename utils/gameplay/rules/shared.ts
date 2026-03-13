import type {
  BoardAlert,
  BoardViewState,
  GameCard,
  GameEvent,
  PlayerState,
  PopupOption,
  TurnCyclePlayerState,
} from "../../types";
import Deck from "../../deck";
import { getPrimaryCharacter, playerIndex } from "../core";
import { createResolutionEvent } from "../events";
import { cycleCleanse } from "../turn-cycle";

type AlertTone = NonNullable<BoardAlert["tone"]>;

interface RuleContext {
  pushAlert: PushAlert;
  state: BoardViewState;
}

interface RuleResult {
  handled: boolean;
}

type PushAlert = (message: string, tone?: AlertTone) => void;

function cloneDeckState(state: BoardViewState) {
  return new Deck<GameCard>([...state.deck.cards], [...state.deck.discards]);
}

function viewerPlayer(state: BoardViewState) {
  const index = playerIndex(state.players, state.playerId);
  return index === -1 ? null : state.players[index]!;
}

function activePlayer(state: BoardViewState) {
  const index = playerIndex(state.players, state.turn);
  return index === -1 ? null : state.players[index]!;
}

function getPlayerById(state: BoardViewState, playerId: number) {
  return state.players.find((player) => player.id === playerId) ?? null;
}

function getCurrentEvent(state: BoardViewState) {
  return state.events[0] ?? null;
}

function resetTurnSelection(state: BoardViewState) {
  state.turnCycle.cards = [];
  state.turnCycle.action = "";
  state.turnCycle.felix = [];
  state.turnCycle.phase = "initial";
}

function drawCardsForPlayer(state: BoardViewState, player: PlayerState, count: number) {
  const deck = cloneDeckState(state);
  const drawnCards = deck.drawCards(count);

  if (drawnCards.length > 0) {
    player.hand.unshift(...drawnCards);
  }

  state.deck = deck;
  return drawnCards;
}

function maybeTriggerLockhart(state: BoardViewState, player: PlayerState) {
  if (!player.power.includes("gilderoy_lockhart") || player.hand.length > 0) {
    return;
  }

  const [drawnCard] = drawCardsForPlayer(state, player, 1);
  if (!drawnCard) {
    return;
  }

  state.events.push(
    createResolutionEvent(
      "You used Gilderoy Lockhart's power to draw a replacement card.",
      [player.id],
      `${getPrimaryCharacter(player)?.shortName || player.name} used Gilderoy Lockhart's power to draw a replacement card.`,
    ),
  );
}

function maybeRewardHermione(state: BoardViewState, player: PlayerState) {
  if (state.turn === player.id || !player.power.includes("hermione_granger")) {
    return;
  }

  const [drawnCard] = drawCardsForPlayer(state, player, 1);
  if (!drawnCard) {
    return;
  }

  state.events.push(
    createResolutionEvent(
      "Hermione's quick thinking let you draw a card.",
      [player.id],
      `${getPrimaryCharacter(player)?.shortName || player.name} used a card out of turn and drew a card through Hermione's power.`,
    ),
  );
}

function ensureReactionState(state: BoardViewState, playerId: number): TurnCyclePlayerState {
  const key = `id${playerId}`;
  const currentValue = state.turnCycle[key];

  if (!currentValue || typeof currentValue !== "object" || !("cards" in currentValue)) {
    state.turnCycle[key] = { cards: [] };
  }

  return state.turnCycle[key] as TurnCyclePlayerState;
}

function discardCards(player: PlayerState, deck: Deck<GameCard>, cards: GameCard[]) {
  for (const selectedCard of cards) {
    let location: "hand" | "tableau" = "hand";
    let currentIndex = player.hand.findIndex((card) => card.id === selectedCard.id);

    if (currentIndex === -1) {
      location = "tableau";
      currentIndex = player.tableau.findIndex((card) => card.id === selectedCard.id);
    }

    if (currentIndex === -1) {
      continue;
    }

    const [discardedCard] = player[location].splice(currentIndex, 1);
    if (discardedCard) {
      deck.serveCard(discardedCard);
    }
  }
}

function discardSelected(state: BoardViewState) {
  const deck = cloneDeckState(state);
  const player = activePlayer(state);

  if (!player) {
    return null;
  }

  discardCards(player, deck, state.turnCycle.cards);
  return { deck, player };
}

function createBystanderPopup(message: string, popupType: "resolution" | "subtle" = "resolution") {
  return {
    message,
    options: [] as PopupOption[],
    popupType,
  };
}

function createDeathPrompt(
  message: string,
  target: PlayerState,
  options: PopupOption[],
  bystanders?: string,
): GameEvent {
  const event: GameEvent = {
    popup: {
      message,
      options,
      popupType: "subtle",
    },
    cardType: getPrimaryCharacter(target)?.fileName || target.name,
    target: [target.id],
  };

  if (bystanders) {
    event.bystanders = createBystanderPopup(bystanders, "subtle");
  }

  return event;
}

function clearCurrentEvent(state: BoardViewState) {
  state.events.shift();
}

function restoreTurnCycleAfterDeath(state: BoardViewState) {
  const afterDeath = state.turnCycle.afterDeath as { action?: string; phase?: string } | undefined;

  if (!afterDeath?.phase) {
    return;
  }

  state.turnCycle.phase = afterDeath.phase;
  state.turnCycle.action = afterDeath.action || "";
  state.turnCycle.afterDeath = {};
}

function summarizeDamagedPlayers(state: BoardViewState, prefix: string) {
  const damaged = state.players
    .filter((player) => ensureReactionState(state, player.id).choice === "takeHit")
    .map((player) => getPrimaryCharacter(player)?.shortName || player.name);

  if (damaged.length === 0) {
    return prefix;
  }

  if (damaged.length === 1) {
    return `${prefix} ${damaged[0]} took damage.`;
  }

  if (damaged.length === 2) {
    return `${prefix} ${damaged[0]} and ${damaged[1]} both took damage.`;
  }

  return `${prefix} ${damaged.slice(0, -1).join(", ")}, and ${damaged.at(-1)} all took damage.`;
}

function finishEventForPlayer(
  state: BoardViewState,
  resolutionEvent: GameEvent | null,
  multiTargetPrefix?: string,
) {
  const event = getCurrentEvent(state);

  if (!event) {
    return;
  }

  if (event.target.length > 1) {
    event.target = event.target.filter((target) => target !== state.playerId);

    if (event.target.length > 0) {
      return;
    }

    clearCurrentEvent(state);

    if (multiTargetPrefix) {
      const summary = summarizeDamagedPlayers(state, multiTargetPrefix);
      state.events.unshift(createResolutionEvent(summary, [state.playerId], summary));
    }
  } else {
    clearCurrentEvent(state);

    if (resolutionEvent) {
      state.events.unshift(resolutionEvent);
    }
  }

  state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
}

function checkTopCardForHouses(state: BoardViewState, houses: string[]) {
  const deck = cloneDeckState(state);
  const drawnCard = deck.drawCards(1)[0];

  if (!drawnCard) {
    return {
      deck,
      gotIt: false,
      house: "Unknown",
    };
  }

  deck.serveCard(drawnCard);

  const houseLabels: Record<string, string> = {
    G: "Griffindor",
    H: "Hufflepuff",
    R: "Ravenclaw",
    S: "Slytherine",
  };

  return {
    deck,
    gotIt: houses.includes(drawnCard.house || ""),
    house: houseLabels[drawnCard.house || ""] || "Unknown",
  };
}

function determineHouse(player: PlayerState, state: BoardViewState) {
  const directHouse = getPrimaryCharacter(player)?.house;
  if (directHouse) {
    return directHouse;
  }

  let previousTurnIndex = state.turnOrder.indexOf(state.playerId) - 1;
  if (previousTurnIndex < 0) {
    previousTurnIndex += state.turnOrder.length;
  }

  const previousPlayer = getPlayerById(state, state.turnOrder[previousTurnIndex] ?? state.playerId);
  const previousHouse = previousPlayer ? getPrimaryCharacter(previousPlayer)?.house : "";

  return previousHouse || "H";
}

export type { PushAlert, RuleContext, RuleResult };
export {
  activePlayer,
  checkTopCardForHouses,
  clearCurrentEvent,
  cloneDeckState,
  createBystanderPopup,
  createDeathPrompt,
  determineHouse,
  discardCards,
  discardSelected,
  drawCardsForPlayer,
  ensureReactionState,
  finishEventForPlayer,
  getCurrentEvent,
  getPlayerById,
  maybeRewardHermione,
  maybeTriggerLockhart,
  resetTurnSelection,
  restoreTurnCycleAfterDeath,
  viewerPlayer,
};
