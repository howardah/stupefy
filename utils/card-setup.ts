import type {
  CharacterCard,
  GameCard,
  GameState,
  PlayerState,
  TurnCycle,
} from "./types";

type DeckConstructor = new <T>(cards?: T[], discards?: T[]) => {
  drawCards(number: number, discard?: boolean): T[];
  shuffle(): void;
};

const Deck = require("./deck") as DeckConstructor;
const { mainDeck, characters } = require("../utils/stupefy-decks.js") as {
  characters: CharacterCard[];
  mainDeck(): GameCard[];
};
const roles = require("../utils/roles.js") as (length: number) => PlayerState["role"][];

function initialise(players: PlayerState[]): GameState {
  // characters.forEach((v, i) => {
  //   v.shots = 1;
  //   v.draw = 2;
  //   characters[i] = v;
  // });

  const initialDeck = new Deck<GameCard>(mainDeck()),
    characterDeck = new Deck<CharacterCard>(characters),
    characterRoles = roles(players.length);

  initialDeck.shuffle();
  initialDeck.shuffle();
  initialDeck.shuffle();
  initialDeck.shuffle();
  characterDeck.shuffle();
  characterDeck.shuffle();
  characterDeck.shuffle();
  characterDeck.shuffle();
  const turnOrder: number[] = [];
  let turn = 0;

  players.forEach((player, i) => {
    player.role = characterRoles[i];
    player.power = [];
    player.tableau = [];
    player.hand = [];
    player.character = [];

    turnOrder.push(player.id);

    // The minister always goes first
    if (player.role === "minister") turn = player.id;

    for (let i = 0; i < 3; i += 1) {
      const drawnCharacter = characterDeck.drawCards(1)[0];
      if (drawnCharacter) {
        player.character.push(drawnCharacter);
      }
    }
  });

  const turnCycle: TurnCycle = {
    action: "",
    cards: [],
    felix: [],
    draw: 2,
    hotseat: -1,
    phase: "unset",
    shots: 1,
    used: [],
  };

  return { players, deck: initialDeck, turn, turnOrder, turnCycle };
}
module.exports = { initialise };
