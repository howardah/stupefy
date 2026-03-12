import { playerIndex, cardsIncludeName } from "../utils/tools";

export const cycleCleanse = (given_turnCycle, that) => {
  given_turnCycle.action = "";
  given_turnCycle.cards = [];
  given_turnCycle.felix = [];
  given_turnCycle.hotseat = -1;
  given_turnCycle.phase = "initial";

  const players = that.state.players,
    this_player = players[playerIndex(players, that.state.turn)];

  players.forEach((player) => {
    given_turnCycle["id" + player.id] = { choice: "", cards: [] };
  });

  if (
    cardsIncludeName(this_player.tableau, "elder_wand") ||
    this_player.character.fileName === "sirius_black"
  ) {
    given_turnCycle.shots = 9999;
  }

  return given_turnCycle;
};
