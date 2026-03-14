import { describe, expect, test } from "bun:test";
import { initialise } from "./card-setup";

describe("card setup", () => {
  test("initialise prepares players, deck state, and turn cycle", () => {
    const game = initialise([
      { character: [], hand: [], id: 11, name: "Ada", power: [], tableau: [] },
      { character: [], hand: [], id: 22, name: "Bea", power: [], tableau: [] },
      { character: [], hand: [], id: 33, name: "Cy", power: [], tableau: [] },
    ]);

    expect(game.players).toHaveLength(3);
    expect(game.turnOrder).toEqual([11, 22, 33]);
    expect(game.deck.cards.length + game.deck.discards.length).toBeGreaterThan(0);
    expect(game.turnCycle.phase).toBe("unset");
    expect(game.turnCycle.draw).toBe(2);
    expect(game.turnCycle.shots).toBe(1);

    for (const player of game.players) {
      expect(player.character).toHaveLength(3);
      expect(player.hand).toEqual([]);
      expect(player.tableau).toEqual([]);
      expect(player.power).toEqual([]);
      expect(player.role).toBeTruthy();
    }

    expect(game.players.some((player) => player.role === "minister" && player.id === game.turn)).toBe(true);
  });
});
