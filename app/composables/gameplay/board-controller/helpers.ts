import type {
  BoardViewState,
  GameCard,
  TurnCyclePlayerKey,
  TurnCyclePlayerState,
} from "@shared/utils/types";
import { playerIndex } from "@shared/utils/gameplay/core";
import { getPopupState } from "@shared/utils/gameplay/events";

function cloneSelectedCards(cards: GameCard[]) {
  return cards.map((card) => ({ ...card, power: { ...card.power } }));
}

function syncActions(state: BoardViewState) {
  state.actions = getPopupState(state.events, state.playerId);
}

function ensureTurnCyclePlayerState(state: BoardViewState, playerId: number) {
  const key: TurnCyclePlayerKey = `id${playerId}`;
  const currentValue = state.turnCycle[key];

  if (!currentValue) {
    state.turnCycle[key] = { cards: [] };
  }

  return state.turnCycle[key] as TurnCyclePlayerState;
}

function activePlayer(state: BoardViewState) {
  const index = playerIndex(state.players, state.turn);
  return index === -1 ? null : state.players[index]!;
}

function viewerPlayer(state: BoardViewState) {
  const index = playerIndex(state.players, state.playerId);
  return index === -1 ? null : state.players[index]!;
}

function resetSelection(state: BoardViewState) {
  state.turnCycle.cards = [];
  state.turnCycle.action = "";
  state.turnCycle.felix = [];
  state.turnCycle.phase = "initial";
}

export {
  activePlayer,
  cloneSelectedCards,
  ensureTurnCyclePlayerState,
  resetSelection,
  syncActions,
  viewerPlayer,
};
