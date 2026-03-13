import type { GameState, PlayerState, WaitingRoomState } from "../types";
import {
  applyGameRoomLifecycle,
  applyWaitingRoomLifecycle,
} from "../room-lifecycle";

function prunePresence(room: WaitingRoomState): WaitingRoomState {
  const active = { ...(room.active || {}) };
  const activeUpdatedAt = { ...(room.activeUpdatedAt || {}) };
  const now = Date.now();

  for (const sessionId of Object.keys(activeUpdatedAt)) {
    if (now - Number(activeUpdatedAt[sessionId]) > 15000) {
      delete activeUpdatedAt[sessionId];
      delete active[sessionId];
    }
  }

  return applyWaitingRoomLifecycle({
    ...room,
    active,
    activeUpdatedAt,
    ready: { ...(room.ready || {}) },
  });
}

function ensureReadyMap(room: WaitingRoomState): Record<string, boolean> {
  const ready = { ...(room.ready || {}) };

  for (const player of room.players) {
    const key = String(player.id);
    if (ready[key] !== true) {
      ready[key] = false;
    }
  }

  for (const key of Object.keys(ready)) {
    if (!room.players.some((player) => String(player.id) === key)) {
      delete ready[key];
    }
  }

  return ready;
}

function areAllPlayersReady(room: WaitingRoomState): boolean {
  if (room.players.length === 0) {
    return false;
  }

  const ready = ensureReadyMap(room);
  return room.players.every((player) => ready[String(player.id)] === true);
}

function playersForGame(room: WaitingRoomState): PlayerState[] {
  return room.players.map((player) => ({
    character: [],
    hand: [],
    id: Number(player.id),
    name: player.name,
    power: [],
    tableau: [],
  }));
}

function normalizeGameRoom(room: GameState | null) {
  return room ? applyGameRoomLifecycle(room) : null;
}

export {
  areAllPlayersReady,
  ensureReadyMap,
  normalizeGameRoom,
  playersForGame,
  prunePresence,
};
