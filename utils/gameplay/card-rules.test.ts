import { describe, expect, test } from "bun:test";
import { sampleGameRoomSnapshot } from "../../fixtures/sample-game-room";
import { createBoardViewState } from "./bootstrap";
import { handleRuleDeckClick, handleRulePopupChoice } from "./card-rules";
import { countAllCards } from "./core";
import { getAvailableTargets } from "./targeting";
import { incrementTurn } from "./turn-cycle";

function createState(playerId = 11) {
  return createBoardViewState(sampleGameRoomSnapshot, {
    id: playerId,
    room: "Sample Room",
  });
}

describe("gameplay targeting", () => {
  test("selected stupefy exposes character targets", () => {
    const state = createState(11);
    const targets = getAvailableTargets(state);

    expect(targets).toContain("characters");
    expect(targets).toContain("wand-range");
  });
});

describe("damage and protection resolution", () => {
  test("protego resolves a stupefy and discards the reaction card", () => {
    const state = createState(11);
    const totalBefore = countAllCards(state).length;
    const protego = state.players[0]!.hand.find((card) => card.name === "protego");

    state.events = [
      {
        popup: {
          message: "Bellatrix has fired a Stupefy at you!",
          options: [
            { label: "Take a hit", function: "takeHit" },
            { label: "Play Protego", function: "playProtego" },
          ],
        },
        instigator: state.players[1],
        cardType: "stupefy",
        target: [11],
      },
    ];
    state.turnCycle.action = "stupefy";
    state.turnCycle.hotseat = 11;
    state.turnCycle.phase = "attack";
    state.turnCycle.id11 = { cards: protego ? [protego] : [] };

    const alerts: string[] = [];
    const result = handleRulePopupChoice(state, "playProtego", 1, (message) => {
      alerts.push(message);
    });

    expect(result.handled).toBe(true);
    expect(alerts).toHaveLength(0);
    expect(state.events[0]?.cardType).toBe("resolution");
    expect(state.players[0]!.hand.some((card) => card.name === "protego")).toBe(false);
    expect(state.deck.discards.some((card) => card.name === "protego")).toBe(true);
    expect(countAllCards(state).length).toBe(totalBefore);
  });
});

describe("death handling", () => {
  test("taking a lethal hit marks the player as dead and discards their cards", () => {
    const state = createState(22);
    const target = state.players[1]!;
    const targetCharacter = Array.isArray(target.character) ? target.character[0]! : target.character;

    targetCharacter.health = 1;
    target.hand = [{ id: 201, name: "accio", fileName: "accio", house: "G", power: {} }];
    target.tableau = [{ id: 202, name: "elder_wand", fileName: "elder_wand", house: "G", power: {} }];

    state.events = [
      {
        popup: {
          message: "Dumbledore has fired a Stupefy at you!",
          options: [{ label: "Take a hit", function: "takeHit" }],
        },
        instigator: state.players[0],
        cardType: "stupefy",
        target: [22],
      },
    ];
    state.turnCycle.action = "stupefy";
    state.turnCycle.hotseat = 22;
    state.turnCycle.phase = "attack";
    state.turnCycle.id22 = { cards: [] };

    const result = handleRulePopupChoice(state, "takeHit", 0, () => {});

    expect(result.handled).toBe(true);
    expect(state.deadPlayers).toContain(22);
    expect(target.hand).toHaveLength(0);
    expect(target.tableau).toHaveLength(0);
    expect(state.deck.discards.some((card) => card.id === 201)).toBe(true);
    expect(state.deck.discards.some((card) => card.id === 202)).toBe(true);
  });
});

describe("discard and draw accounting", () => {
  test("discard confirmation moves the selected card from hand to discard without losing cards", () => {
    const state = createState(11);
    const totalBefore = countAllCards(state).length;

    state.turnCycle.phase = "selected";
    state.turnCycle.action = "discard";
    state.turnCycle.cards = [state.players[0]!.hand[0]!];

    const startDiscard = handleRuleDeckClick(state, "discard", () => {});
    expect(startDiscard.handled).toBe(true);
    expect(state.turnCycle.action).toBe("discardEvent");

    const confirm = handleRulePopupChoice(state, "dump", 0, () => {});
    expect(confirm.handled).toBe(true);
    expect(state.players[0]!.hand.some((card) => card.id === 9)).toBe(false);
    expect(state.deck.discards.some((card) => card.id === 9)).toBe(true);
    expect(countAllCards(state).length).toBe(totalBefore);
  });
});

describe("turn transitions", () => {
  test("incrementTurn skips dead players", () => {
    expect(incrementTurn(11, [11, 22, 33], [22])).toBe(33);
  });
});
