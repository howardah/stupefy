import { describe, expect, test } from "bun:test";
import { CHARACTER_CATALOG } from "./character-catalog";
import { buildMainDeck } from "./build-main-deck";

describe("game data builders", () => {
  test("buildMainDeck preserves the expected card counts and house spread", () => {
    const deck = buildMainDeck();

    expect(deck).toHaveLength(82);
    expect(deck.filter((card) => card.name === "stupefy")).toHaveLength(25);
    expect(deck.filter((card) => card.name === "protego")).toHaveLength(12);
    expect(deck.filter((card) => card.name === "expelliarmus")).toHaveLength(4);
    expect(deck.filter((card) => card.house === "G")).toHaveLength(20);
    expect(deck.filter((card) => card.house === "R")).toHaveLength(21);
    expect(deck.filter((card) => card.house === "S")).toHaveLength(20);
    expect(deck.filter((card) => card.house === "H")).toHaveLength(21);
    expect(new Set(deck.map((card) => card.id)).size).toBe(82);
  });

  test("character catalog preserves the expected roster size", () => {
    expect(CHARACTER_CATALOG).toHaveLength(31);
    expect(CHARACTER_CATALOG.some((character) => character.fileName === "albus_dumbledore")).toBe(true);
    expect(CHARACTER_CATALOG.some((character) => character.fileName === "voldemort")).toBe(true);
  });
});
