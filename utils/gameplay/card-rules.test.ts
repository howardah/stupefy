import { describe, expect, test } from "bun:test";
import { sampleGameRoomSnapshot } from "../../fixtures/sample-game-room";
import { createBoardViewState } from "./bootstrap";
import {
  handleRuleCharacterClick,
  handleRuleDeckClick,
  handleRulePopupChoice,
} from "./card-rules";
import { countAllCards } from "./core";
import { getAvailableTargets } from "./targeting";
import { incrementTurn } from "./turn-cycle";

function createState(playerId = 11) {
  return createBoardViewState(structuredClone(sampleGameRoomSnapshot), {
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

  test("bellatrix requires two protego cards to block her stupefy", () => {
    const state = createState(11);
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
    const state = createState(22);
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

  test("harry potter survives the first lethal hit in a round", () => {
    const state = createState(22);
    const target = state.players[1]!;
    target.power = ["harry_potter"];
    const targetCharacter = Array.isArray(target.character) ? target.character[0]! : target.character;
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
    const state = createState(22);
    const target = state.players[1]!;
    const targetCharacter = Array.isArray(target.character) ? target.character[0]! : target.character;
    targetCharacter.health = 1;
    target.tableau = [
      { id: 501, name: "elder_wand", fileName: "elder_wand", house: "G", power: {} },
      { id: 502, name: "invisibility_cloak", fileName: "invisibility_cloak", house: "G", power: {} },
      { id: 503, name: "resurrection_stone", fileName: "resurrection_stone", house: "G", power: {} },
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
    const state = createState(22);
    const target = state.players[1]!;
    const targetCharacter = Array.isArray(target.character) ? target.character[0]! : target.character;
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
    expect(state.turnCycle.phase).toBe("death");
    expect(state.events[0]?.popup?.options.map((option) => option.function)).toContain("lily_yes");

    state.playerId = 11;
    const save = handleRulePopupChoice(state, "lily_yes", 0, () => {});
    expect(save.handled).toBe(true);
    expect(targetCharacter.health).toBe(1);
    expect(lilyCharacter.health).toBe(3);
    expect(state.deadPlayers).not.toContain(22);
  });

  test("molly can will her hand to another player on death", () => {
    const state = createState(22);
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
    const state = createState(22);
    const target = state.players[1]!;
    target.hand = [{ id: 401, name: "accio", fileName: "accio", house: "G", power: {} }];
    const targetCharacter = Array.isArray(target.character) ? target.character[0]! : target.character;
    targetCharacter.health = 1;

    const umbridge = state.players[0]!;
    umbridge.power = ["dolores_umbridge"];
    const voldemort = state.players[2]!;
    voldemort.power = ["voldemort"];
    const voldemortCharacter = Array.isArray(voldemort.character) ? voldemort.character[0]! : voldemort.character;
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
