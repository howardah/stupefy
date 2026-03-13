import { describe, expect, test } from "bun:test";
import {
  handleRuleDeckClick,
  handleRulePopupChoice,
} from "../card-rules";
import { countAllCards } from "../core";
import { createGameplayTestState } from "../test-helpers";
import { getAvailableTargets } from "../targeting";

describe("gameplay targeting", () => {
  test("selected stupefy exposes character targets", () => {
    const state = createGameplayTestState(11);
    const targets = getAvailableTargets(state);

    expect(targets).toContain("characters");
    expect(targets).toContain("wand-range");
  });
});

describe("discard and draw accounting", () => {
  test("discard confirmation moves the selected card from hand to discard without losing cards", () => {
    const state = createGameplayTestState(11);
    const totalBefore = countAllCards(state).length;

    state.turnCycle.phase = "selected";
    state.turnCycle.action = "discard";
    state.turnCycle.cards = [state.players[0]!.hand[0]!];

    const startDiscard = handleRuleDeckClick(state, "discard", () => {});
    expect(startDiscard.handled).toBe(true);
    expect<string>(state.turnCycle.action).toBe("discardEvent");

    const confirm = handleRulePopupChoice(state, "dump", 0, () => {});
    expect(confirm.handled).toBe(true);
    expect(state.players[0]!.hand.some((card) => card.id === 9)).toBe(false);
    expect(state.deck.discards.some((card) => card.id === 9)).toBe(true);
    expect(countAllCards(state).length).toBe(totalBefore);
  });
});
