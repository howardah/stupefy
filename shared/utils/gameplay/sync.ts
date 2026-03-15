import type { BoardViewState, GameState } from "../types";
import { cloneBoardViewState, cloneTurnCycle } from "./bootstrap";

function clonePlayers(state: BoardViewState) {
  const snapshot = cloneBoardViewState(state);
  return snapshot.players;
}

export function createGameStatePatch(state: BoardViewState): Partial<GameState> {
  const snapshot = cloneBoardViewState(state);

  return {
    deadPlayers: [...snapshot.deadPlayers],
    deck: snapshot.deck,
    events: snapshot.events,
    players: snapshot.players,
    table: [...snapshot.table],
    turn: snapshot.turn,
    turnCycle: cloneTurnCycle(snapshot.turnCycle),
    turnOrder: [...snapshot.turnOrder],
  };
}

export function getGameplaySyncSignature(state: BoardViewState): string {
  return JSON.stringify({
    deadPlayers: state.deadPlayers,
    deck: state.deck,
    events: state.events,
    players: clonePlayers(state),
    table: state.table,
    turn: state.turn,
    turnCycle: state.turnCycle,
    turnOrder: state.turnOrder,
  });
}
