import { Deck } from "./deck";

export const cardRules = {
  stupefy: () => {
    console.log("Shot ye!");
  },
  protego: () => {
    console.log("no you didn't!");
  },
};

export const mainDeck = () => {
  let houses = Array(82)
    .fill("G", 0, 20)
    .fill("R", 20, 41)
    .fill("S", 41, 61)
    .fill("H", 61, 82);
  let accio = Array(4).fill({ name: "accio", power: {} }),
    stupefy = Array(25).fill({ name: "stupefy", power: {} }),
    protego = Array(12).fill({ name: "protego", power: {} }),
    azkaban = Array(3).fill({ name: "azkaban", power: { jailed: true } }),
    beer = Array(6).fill({ name: "butterbeer", power: {} }),
    expelliarmus = [...Array(4)].map((e) => ({
      name: "expelliarmus_" + Math.ceil(Math.random() * 3),
      power: {},
    })),
    others = [
      { name: "larch_wand", power: { range: 4 } },
      { name: "yew_wand", power: { range: 4 } },
      { name: "aspen_wand", power: { range: 3 } },
      { name: "holly_wand", power: { range: 2, "yew-immunity": true } },
      { name: "elder_wand", power: { shots: Number.POSITIVE_INFINITY } },
      { name: "fiendfyre", power: {} },
      { name: "broomstick", power: { distance: 1 } },
      { name: "broomstick", power: { distance: 1 } },
      { name: "polyjuice_potion", power: {} },
      { name: "resurrection_stone", power: {} },
      { name: "expecto_patronum", power: {} },
      { name: "wizards_duel", power: {} },
      { name: "wizards_duel", power: {} },
      { name: "wizards_duel", power: {} },
      { name: "weasleys_wizard_weezes", power: {} },
      { name: "vanishing_cabinet", power: {} },
      { name: "vanishing_cabinet", power: {} },
      { name: "invisibility_cloak", power: {} },
      { name: "felix_felicis", power: {} },
      { name: "dementors", power: {} },
      { name: "dementors", power: {} },
      { name: "apparate", power: {} },
      { name: "three_broomsticks", power: {} },
      { name: "honeydukes", power: {} },
      { name: "honeydukes", power: {} },
      { name: "garroting_gas", power: {} },
      { name: "diagon_alley", power: {} },
      { name: "diagon_alley", power: {} },
    ],
    deck = [
      ...accio,
      ...stupefy,
      ...protego,
      ...azkaban,
      ...beer,
      ...others,
      ...expelliarmus,
    ];

  deck.forEach((v, i) => {
    deck[i] = {
      id: i,
      name: v.name,
      fileName: v.name,
      power: v.power,
      house: houses.splice(Math.floor(Math.random() * houses.length), 1)[0],
    };
  });

  return deck;
};

const characters = [
  {
    fileName: "albus_dumbledore",
    name: "Albus Dumbledore",
    house: "G",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "arthur_weasley",
    name: "Arthur Weasley",
    house: "G",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "bellatrix_lestrange",
    name: "Bellatrix Lestrange",
    house: "S",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "cedric_diggory",
    name: "Cedric Diggory",
    house: "H",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "dobby",
    name: "Dobby",
    house: "",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "dolores_umbridge",
    name: "Dolores Umbridge",
    house: "S",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "draco_malfoy",
    name: "Draco Malfoy",
    house: "S",
    health: 3,
    "max-health": 3,
    power: {},
  },
  {
    fileName: "fenrir_greyback",
    name: "Fenrir Greyback",
    house: "S",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "fred_and_george",
    name: "Fred & George Weasley",
    house: "G",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "gilderoy_lockhart",
    name: "Gilderoy Lockhart",
    house: "R",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "ginny_weasley",
    name: "Ginny Weasley",
    house: "G",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "harry_potter",
    name: "Harry Potter",
    house: "G",
    health: 3,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "hermione_granger",
    name: "Hermione Granger",
    house: "G",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "james_potter",
    name: "James Potter",
    house: "G",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "lily_potter",
    name: "Lily Potter",
    house: "G",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "lucius_malfoy",
    name: "Lucius Malfoy",
    house: "S",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "luna_lovegood",
    name: "Luna Lovegood",
    house: "R",
    health: 3,
    "max-health": 3,
    power: {},
  },
  {
    fileName: "mad-eye_moody",
    name: 'Alastor "Mad-Eye" Moody',
    house: "R",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "minerva_mchonagall",
    name: "Minerva McGonagall",
    house: "G",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "molly_weasley",
    name: "Molly Weasley",
    house: "G",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "mundungus_fletcher",
    name: "Mundungus Fletcher",
    house: "S",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "neville_longbottom",
    name: "Neville Longbottom",
    house: "G",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "nymphadora_tonks",
    name: "Nymphadora Tonks",
    house: "H",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "peeves",
    name: "Peeves",
    house: "",
    health: 3,
    "max-health": 3,
    power: {},
  },
  {
    fileName: "peter_pettigrew",
    name: "Peter Pettigrew",
    house: "G",
    health: 3,
    "max-health": 3,
    power: {},
  },
  {
    fileName: "remus_lupin",
    name: "Remus Lupin",
    house: "G",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "ron_weasley",
    name: "Ron Weasley",
    house: "G",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "rubeus_hagrid",
    name: "Rubeus Hagrid",
    house: "G",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "severus_snape",
    name: "Severus Snape",
    house: "S",
    health: 3,
    "max-health": 3,
    power: {},
  },
  {
    fileName: "sirius_black",
    name: "Sirius Black",
    house: "G",
    health: 4,
    "max-health": 4,
    power: {},
  },
  {
    fileName: "voldemort",
    name: "Voldemort",
    house: "S",
    health: 3,
    "max-health": 3,
    power: {},
  },
];

characters.forEach((v, i) => {
  v.shots = 1;
  v.draw = 2;
  characters[i] = v;
});

// export const Deck = class {
//   constructor(cards, discards) {
//     this.cards = cards || [];
//     this.discards = discards || [];
//   }

//   getLength() {
//     return this.cards.length;
//   }

//   drawCards(number, discard) {
//     if (discard) return this.discards.splice(0, number);
//     if (this.cards.length === 0) this.shuffle();
//     return this.cards.splice(0, number);
//   }

//   backToTheTop(cards) {
//     this.cards.unshift(cards);
//   }

//   serveCard(inCard) {
//     this.discards.unshift(inCard);
//   }

//   shuffle() {
//     let toShuffle = [...this.cards, ...this.discards];

//     for (let i = toShuffle.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * i);
//       const temp = toShuffle[i];
//       toShuffle[i] = toShuffle[j];
//       toShuffle[j] = temp;
//     }

//     this.cards = toShuffle;
//     this.discards = [];
//   }
// };

const initialDeck = new Deck(mainDeck()),
  characterDeck = new Deck(characters);

initialDeck.shuffle();
characterDeck.shuffle();

export const players = [
    {
      id: 0,
      name: "Adam",
      character: characterDeck.drawCards(1)[0],
      tableau: [],
      hand: [
        initialDeck.drawCards(1)[0],
        initialDeck.drawCards(1)[0],
        initialDeck.drawCards(1)[0],
      ],
    },
    {
      id: 1,
      name: "Eleven",
      character: characterDeck.drawCards(1)[0],
      tableau: [],
      hand: [initialDeck.drawCards(1)[0], initialDeck.drawCards(1)[0]],
    },
    {
      id: 2,
      name: "Doug",
      character: characterDeck.drawCards(1)[0],
      tableau: [],
      hand: [initialDeck.drawCards(1)[0], initialDeck.drawCards(1)[0]],
    },
    {
      id: 3,
      name: "Kurt",
      character: characterDeck.drawCards(1)[0],
      tableau: [],
      hand: [initialDeck.drawCards(1)[0], initialDeck.drawCards(1)[0]],
    },
    {
      id: 4,
      name: "Velcro",
      character: characterDeck.drawCards(1)[0],
      tableau: [],
      hand: [initialDeck.drawCards(1)[0], initialDeck.drawCards(1)[0]],
    },
  ],
  deck = initialDeck;

export const emptyCard = { id: "", fileName: "", house: "", name: "" };

export { initialDeck, characterDeck };
