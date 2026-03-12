import type { GameState } from "~/utils/types";

export const sampleGameRoomSnapshot: GameState = {
  _id: 0,
  deadPlayers: [],
  deck: {
    cards: [
      { id: 31, name: "stupefy", fileName: "stupefy", house: "G", power: {} },
      { id: 32, name: "protego", fileName: "protego", house: "R", power: {} },
      { id: 33, name: "butterbeer", fileName: "butterbeer", house: "H", power: {} },
    ],
    discards: [
      { id: 2, name: "accio", fileName: "accio", house: "S", power: {} },
      { id: 3, name: "protego", fileName: "protego", house: "G", power: {} },
    ],
  },
  events: [
    {
      popup: {
        message: "Choose a target for your Stupefy.",
        options: [],
        popupType: "subtle",
      },
      bystanders: {
        message: "Ada is choosing a target.",
        options: [],
        popupType: "subtle",
      },
      cardType: "stupefy",
      target: [11],
    },
  ],
  players: [
    {
      id: 11,
      name: "Ada",
      role: "minister",
      tableau: [
        { id: 8, name: "elder_wand", fileName: "elder_wand", house: "G", power: {} },
      ],
      hand: [
        { id: 9, name: "stupefy", fileName: "stupefy", house: "R", power: {} },
        { id: 10, name: "protego", fileName: "protego", house: "H", power: {} },
      ],
      power: ["albus_dumbledore"],
      character: {
        fileName: "albus_dumbledore",
        name: "Albus Dumbledore",
        shortName: "Dumbledore",
        house: "G",
        health: 4,
        maxHealth: 4,
        power: {},
      },
    },
    {
      id: 22,
      name: "Bea",
      role: "death eater",
      tableau: [
        { id: 11, name: "vanishing_cabinet", fileName: "vanishing_cabinet", house: "S", power: {} },
      ],
      hand: [
        { id: 12, name: "expelliarmus", fileName: "expelliarmus_1", house: "S", power: {} },
      ],
      power: [],
      character: {
        fileName: "bellatrix_lestrange",
        name: "Bellatrix Lestrange",
        shortName: "Bellatrix",
        house: "S",
        health: 4,
        maxHealth: 4,
        power: {},
      },
    },
    {
      id: 33,
      name: "Cy",
      role: "auror",
      tableau: [],
      hand: [
        { id: 13, name: "butterbeer", fileName: "butterbeer", house: "H", power: {} },
      ],
      power: [],
      character: {
        fileName: "remus_lupin",
        name: "Remus Lupin",
        shortName: "Lupin",
        house: "G",
        health: 3,
        maxHealth: 4,
        power: {},
      },
    },
  ],
  table: [
    { id: 14, name: "diagon_alley", fileName: "diagon_alley", house: "R", power: {} },
  ],
  turn: 11,
  turnCycle: {
    action: "stupefy",
    cards: [{ id: 9, name: "stupefy", fileName: "stupefy", house: "R", power: {} }],
    felix: [],
    draw: 1,
    hotseat: -1,
    phase: "selected",
    shots: 1,
    used: [],
  },
  turnOrder: [11, 22, 33],
  last_updated: 1741737600000,
};
