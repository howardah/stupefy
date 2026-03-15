import { describe, expect, test } from "bun:test";
import Deck from "./deck";

describe("Deck", () => {
  test("drawCards draws from the requested pile", () => {
    const deck = new Deck([1, 2, 3], [4, 5]);

    expect(deck.drawCards(2)).toEqual([1, 2]);
    expect(deck.drawCards(1, true)).toEqual([4]);
    expect(deck.cards).toEqual([3]);
    expect(deck.discards).toEqual([5]);
  });

  test("backToTheTop and serve helpers update the piles", () => {
    const deck = new Deck<number>([], []);

    deck.backToTheTop(8);
    deck.serveCard(3);
    deck.serveCards([4, 5]);

    expect(deck.cards).toEqual([8]);
    expect(deck.discards).toEqual([4, 5, 3]);
  });

  test("drawCards shuffles discards back into cards when needed", () => {
    const deck = new Deck<number>([], [7, 8]);

    const drawn = deck.drawCards(1);

    expect(drawn).toHaveLength(1);
    expect([...drawn, ...deck.cards].sort()).toEqual([7, 8]);
    expect(deck.discards).toEqual([]);
  });
});
