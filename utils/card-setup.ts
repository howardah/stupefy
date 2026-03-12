const Deck = require("./deck");
const { mainDeck, characters } = require("../utils/stupefy-decks.js");
const roles = require("../utils/roles.js");

function initialise(players) {
  // characters.forEach((v, i) => {
  //   v.shots = 1;
  //   v.draw = 2;
  //   characters[i] = v;
  // });

  const initialDeck = new Deck(mainDeck()),
    characterDeck = new Deck(characters),
    characterRoles = roles(players.length);

  initialDeck.shuffle();
  initialDeck.shuffle();
  initialDeck.shuffle();
  initialDeck.shuffle();
  characterDeck.shuffle();
  characterDeck.shuffle();
  characterDeck.shuffle();
  characterDeck.shuffle();
  let fish = {
    id: 0,
    name: "Adam",
    character: characterDeck.drawCards(1)[0],
    role: characterRoles[0],
    tableau: [],
    hand: [],
    power: [],
  };

  const turnOrder = [];
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

    for (let i = 0; i < 3; i++) {
      player.character.push(characterDeck.drawCards(1)[0]);
    }
  });

  const turnCycle = {
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
