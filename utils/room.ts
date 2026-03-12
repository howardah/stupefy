import camelCase from "lodash/camelCase";

export function normalizeRoomName(room: string): string {
  return room.trim();
}

export function normalizeRoomKey(room: string): string {
  return camelCase(normalizeRoomName(room));
}

export function roomPasswordKey(room: string): string {
  return normalizeRoomName(room).replace(" ", "_");
}
