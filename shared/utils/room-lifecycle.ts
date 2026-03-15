import type { GameState, WaitingRoomState } from "./types";

export const WAITING_ROOM_IDLE_TTL_MS = 2 * 60 * 60 * 1000;
export const GAME_ROOM_IDLE_TTL_MS = 2 * 24 * 60 * 60 * 1000;

function asTimestamp(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function applyWaitingRoomLifecycle(
  room: WaitingRoomState,
  now = Date.now(),
): WaitingRoomState {
  const lastUpdated = asTimestamp(room.last_updated, now);
  const createdAt = asTimestamp(room.createdAt, lastUpdated);
  const startedAt =
    typeof room.startedAt === "number" && Number.isFinite(room.startedAt)
      ? room.startedAt
      : undefined;
  const baseStatus = room.status ?? (room.gameRoomKey ? "in-game" : "waiting");
  const activeSessionCount = Object.keys(room.active || {}).length;

  const expiresAt =
    typeof room.expiresAt === "number" && Number.isFinite(room.expiresAt)
      ? room.expiresAt
      : baseStatus === "waiting"
        ? lastUpdated + WAITING_ROOM_IDLE_TTL_MS
        : lastUpdated + GAME_ROOM_IDLE_TTL_MS;

  const isExpired = expiresAt <= now && activeSessionCount === 0;
  const status = isExpired ? "archived" : baseStatus;

  return {
    ...room,
    archivedAt: status === "archived" ? asTimestamp(room.archivedAt, now) : undefined,
    createdAt,
    expiresAt,
    last_updated: lastUpdated,
    startedAt,
    status,
  };
}

export function applyGameRoomLifecycle(room: GameState, now = Date.now()): GameState {
  const lastUpdated = asTimestamp(room.last_updated, now);
  const createdAt = asTimestamp(room.createdAt, lastUpdated);
  const startedAt = asTimestamp(room.startedAt, createdAt);
  const expiresAt =
    typeof room.expiresAt === "number" && Number.isFinite(room.expiresAt)
      ? room.expiresAt
      : lastUpdated + GAME_ROOM_IDLE_TTL_MS;
  const status = expiresAt <= now ? "archived" : (room.status ?? "active");

  return {
    ...room,
    archivedAt: status === "archived" ? asTimestamp(room.archivedAt, now) : undefined,
    createdAt,
    expiresAt,
    last_updated: lastUpdated,
    startedAt,
    status,
  };
}

export function isWaitingRoomAvailable(room: WaitingRoomState) {
  return room.status === "waiting";
}

export function isGameRoomActive(room: GameState) {
  return room.status === "active";
}
