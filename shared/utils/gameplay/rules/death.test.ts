import { describe, expect, test } from "bun:test";
import { handleRuleCharacterClick, handleRulePopupChoice } from "../card-rules";
import { createGameplayTestState } from "../test-helpers";

describe("death handling", () => {
  test("taking a lethal hit marks the player as dead and discards their cards", () => {
    const state = createGameplayTestState(22);
    const target = state.players[1]!;
    const targetCharacter = Array.isArray(target.character)
      ? target.character[0]!
      : target.character;

    targetCharacter.health = 1;
    target.hand = [{ id: 201, name: "accio", fileName: "accio", house: "G", power: {} }];
    target.tableau = [
      { id: 202, name: "elder_wand", fileName: "elder_wand", house: "G", power: {} },
    ];

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

  test("harry potter survives the first lethal hit in a round", () => {
    const state = createGameplayTestState(22);
    const target = state.players[1]!;
    target.power = ["harry_potter"];
    const targetCharacter = Array.isArray(target.character)
      ? target.character[0]!
      : target.character;
    targetCharacter.health = 1;
    targetCharacter.fileName = "harry_potter";

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
    expect(state.deadPlayers).not.toContain(22);
    expect(targetCharacter.health).toBe(1);
    expect((targetCharacter as { end?: { deaths?: number } }).end?.deaths).toBe(1);
  });

  test("the deathly hallows protect the last life point", () => {
    const state = createGameplayTestState(22);
    const target = state.players[1]!;
    const targetCharacter = Array.isArray(target.character)
      ? target.character[0]!
      : target.character;
    targetCharacter.health = 1;
    target.tableau = [
      { id: 501, name: "elder_wand", fileName: "elder_wand", house: "G", power: {} },
      {
        id: 502,
        name: "invisibility_cloak",
        fileName: "invisibility_cloak",
        house: "G",
        power: {},
      },
      {
        id: 503,
        name: "resurrection_stone",
        fileName: "resurrection_stone",
        house: "G",
        power: {},
      },
    ];

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

    handleRulePopupChoice(state, "takeHit", 0, () => {});

    expect(targetCharacter.health).toBe(1);
    expect(state.deadPlayers).not.toContain(22);
  });

  test("lily can interrupt a death and save the target", () => {
    const state = createGameplayTestState(22);
    const target = state.players[1]!;
    const targetCharacter = Array.isArray(target.character)
      ? target.character[0]!
      : target.character;
    targetCharacter.health = 1;

    const lily = state.players[0]!;
    lily.power = ["lily_potter"];
    const lilyCharacter = Array.isArray(lily.character) ? lily.character[0]! : lily.character;
    lilyCharacter.fileName = "lily_potter";
    lilyCharacter.shortName = "Lily";

    state.events = [
      {
        popup: {
          message: "Lily has fired a Stupefy at you!",
          options: [{ label: "Take a hit", function: "takeHit" }],
        },
        instigator: lily,
        cardType: "stupefy",
        target: [22],
      },
    ];
    state.turnCycle.action = "stupefy";
    state.turnCycle.hotseat = 22;
    state.turnCycle.phase = "attack";
    state.turnCycle.id22 = { cards: [] };

    const interrupt = handleRulePopupChoice(state, "takeHit", 0, () => {});

    expect(interrupt.handled).toBe(true);
    expect<string>(state.turnCycle.phase).toBe("death");
    expect(state.events[0]?.popup?.options.map((option) => option.function)).toContain("lily_yes");

    state.playerId = 11;
    const save = handleRulePopupChoice(state, "lily_yes", 0, () => {});
    expect(save.handled).toBe(true);
    expect(targetCharacter.health).toBe(1);
    expect(lilyCharacter.health).toBe(3);
    expect(state.deadPlayers).not.toContain(22);
  });

  test("molly can will her hand to another player on death", () => {
    const state = createGameplayTestState(22);
    const molly = state.players[1]!;
    molly.power = ["molly_weasley"];
    molly.hand = [{ id: 301, name: "accio", fileName: "accio", house: "G", power: {} }];
    const mollyCharacter = Array.isArray(molly.character) ? molly.character[0]! : molly.character;
    mollyCharacter.fileName = "molly_weasley";
    mollyCharacter.shortName = "Molly";
    mollyCharacter.health = 1;

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

    handleRulePopupChoice(state, "takeHit", 0, () => {});
    expect(state.events[0]?.cardType).toBe("molly_weasley");

    state.playerId = 22;
    const transfer = handleRuleCharacterClick(state, 33, () => {});
    expect(transfer.handled).toBe(true);
    expect(state.players[2]!.hand.some((card) => card.id === 301)).toBe(true);
    expect(molly.hand).toHaveLength(0);
  });

  test("umbridge inherits cards and voldemort gains health on another player's death", () => {
    const state = createGameplayTestState(22);
    const target = state.players[1]!;
    target.hand = [{ id: 401, name: "accio", fileName: "accio", house: "G", power: {} }];
    const targetCharacter = Array.isArray(target.character)
      ? target.character[0]!
      : target.character;
    targetCharacter.health = 1;

    const umbridge = state.players[0]!;
    umbridge.power = ["dolores_umbridge"];
    const voldemort = state.players[2]!;
    voldemort.power = ["voldemort"];
    const voldemortCharacter = Array.isArray(voldemort.character)
      ? voldemort.character[0]!
      : voldemort.character;
    voldemortCharacter.health = 2;
    voldemortCharacter.maxHealth = 3;

    state.events = [
      {
        popup: {
          message: "Dumbledore has fired a Stupefy at you!",
          options: [{ label: "Take a hit", function: "takeHit" }],
        },
        instigator: umbridge,
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
    expect(umbridge.hand.some((card) => card.id === 401)).toBe(true);
    expect(voldemortCharacter.health).toBe(3);
    expect(voldemortCharacter.maxHealth).toBe(4);
  });
});
