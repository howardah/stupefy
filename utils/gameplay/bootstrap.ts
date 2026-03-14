import type {
  BoardViewState,
  DeckState,
  GameState,
  GameEvent,
  GameCard,
  PlayerCharacterState,
  PlayerState,
  PlayQuery,
  TurnCycle,
  TurnCyclePlayerKey,
  TurnCyclePlayerState,
} from "../types";
import { getPopupState } from "./events";
import { cloneDeck, countAllCards, sortPlayers } from "./core";

export { countAllCards, sortPlayers };

function cloneCharacter(character: PlayerCharacterState): PlayerCharacterState {
  if (Array.isArray(character)) {
    return character.map((entry) => ({ ...entry }));
  }

  return { ...character };
}

function cloneCard(card: GameCard): GameCard {
  return {
    ...card,
    power: { ...card.power },
  };
}

function cloneEvent(event: GameEvent): GameEvent {
  return {
    ...event,
    bystanders:
      event.bystanders && typeof event.bystanders === "object"
        ? { ...event.bystanders, options: [...event.bystanders.options] }
        : event.bystanders,
    deck: event.deck ? cloneDeck(event.deck) : event.deck,
    instigator: event.instigator
      ? {
          ...event.instigator,
          character: cloneCharacter(event.instigator.character),
          hand: event.instigator.hand.map(cloneCard),
          power: [...event.instigator.power],
          tableau: event.instigator.tableau.map(cloneCard),
        }
      : event.instigator,
    popup: event.popup ? { ...event.popup, options: [...event.popup.options] } : event.popup,
    table: event.table ? event.table.map(cloneCard) : event.table,
    target: [...event.target],
  };
}

function cloneTurnCyclePlayerState(
  value: TurnCyclePlayerState | undefined,
): TurnCyclePlayerState | undefined {
  if (!value) {
    return value;
  }

  return {
    ...value,
    cards: value.cards.map(cloneCard),
  };
}

function cloneFelixPlayers(players: PlayerState[]): PlayerState[] {
  return players.map((player) => ({
    ...player,
    character: cloneCharacter(player.character),
    hand: player.hand.map(cloneCard),
    power: [...player.power],
    tableau: player.tableau.map(cloneCard),
  }));
}

export function cloneTurnCycle(turnCycle: TurnCycle): TurnCycle {
  const clone: TurnCycle = {
    ...turnCycle,
    cards: turnCycle.cards.map(cloneCard),
    felix: cloneFelixPlayers(turnCycle.felix),
    used: [...turnCycle.used],
  };

  for (const [key, value] of Object.entries(turnCycle)) {
    if (/^id\d+$/.test(key)) {
      clone[key as TurnCyclePlayerKey] = cloneTurnCyclePlayerState(
        value as TurnCyclePlayerState | undefined,
      );
    }
  }

  return clone;
}

function clonePlayer(player: PlayerState): PlayerState {
  return {
    ...player,
    character: cloneCharacter(player.character),
    hand: player.hand.map(cloneCard),
    power: [...player.power],
    tableau: player.tableau.map(cloneCard),
  };
}

export function cloneBoardViewState(state: BoardViewState): BoardViewState {
  const events = state.events.map(cloneEvent);

  return {
    ...state,
    actions: getPopupState(events, state.playerId),
    alerts: [...state.alerts],
    deck: cloneDeck(state.deck),
    events,
    players: state.players.map(clonePlayer),
    table: state.table.map(cloneCard),
    turnCycle: cloneTurnCycle(state.turnCycle),
    turnOrder: [...state.turnOrder],
  };
}

export function createBoardViewState(setupObj: GameState, query: PlayQuery): BoardViewState {
  const players = sortPlayers(setupObj.players, setupObj.turnOrder);
  const events = setupObj.events || [];

  return {
    actions: getPopupState(events, query.id),
    alerts: [],
    deadPlayers: setupObj.deadPlayers || [],
    deck: setupObj.deck as DeckState,
    events,
    playerId: query.id,
    playerRoom: query.room,
    players,
    running: true,
    showCards: true,
    table: setupObj.table || [],
    turn: setupObj.turn,
    turnCycle: setupObj.turnCycle,
    turnOrder: setupObj.turnOrder,
  };
}
