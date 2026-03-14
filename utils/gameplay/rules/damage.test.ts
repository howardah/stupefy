import { describe, expect, test } from "bun:test";
import { countAllCards } from "../core";
import { handleRulePopupChoice } from "../card-rules";
import { createGameplayTestState } from "../test-helpers";

describe("damage and protection resolution", () => {
  test("protego resolves a stupefy and discards the reaction card", () => {
    const state = createGameplayTestState(11);
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

  test("bellatrix requires two protego cards to block her stupefy", () => {
    const state = createGameplayTestState(11);
    const protego = state.players[0]!.hand.find((card) => card.name === "protego");

    state.players[1]!.power = ["bellatrix_lestrange"];
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

    expect(result.handled).toBe(false);
    expect(alerts[0]).toContain("Bellatrix");
    expect(state.events[0]?.cardType).toBe("stupefy");
  });

  test("arthur draws a card after taking damage", () => {
    const state = createGameplayTestState(22);
    const target = state.players[1]!;
    target.power = ["arthur_weasley"];

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

    const handSize = target.hand.length;
    handleRulePopupChoice(state, "takeHit", 0, () => {});

    expect(target.hand.length).toBe(handSize + 1);
  });
});
