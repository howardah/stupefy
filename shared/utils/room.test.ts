import { describe, expect, test } from "bun:test";
import { normalizeRoomKey, normalizeRoomName, roomPasswordKey } from "./room";

describe("room naming helpers", () => {
  test("normalizeRoomName trims outer whitespace", () => {
    expect(normalizeRoomName("  Great Hall  ")).toBe("Great Hall");
  });

  test("normalizeRoomKey camel-cases the normalized room name", () => {
    expect(normalizeRoomKey("  Great Hall Showdown  ")).toBe("greatHallShowdown");
  });

  test("roomPasswordKey replaces the first space after trimming", () => {
    expect(roomPasswordKey("  Great Hall  ")).toBe("Great_Hall");
  });
});
