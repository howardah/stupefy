import type {
  BoardViewState,
  DeckState,
  GameState,
  PlayQuery,
} from "../types";
import { getPopupState } from "./events";
import { countAllCards, sortPlayers } from "./core";

export { countAllCards, sortPlayers };

export function createBoardViewState(
  setupObj: GameState,
  query: PlayQuery
): BoardViewState {
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
