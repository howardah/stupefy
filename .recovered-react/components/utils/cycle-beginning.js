import { playerIndex, cardsIncludeName } from "../utils/tools";
import cloneDeep from "lodash/cloneDeep";

export const cycleBeginning = (given_turnCycle, that) => {
  let turnCycle = Object.assign(cloneDeep(given_turnCycle), {
    action: "",
    cards: [],
    felix: [],
    hotseat: -1,
    phase: "initial",
  });

  console.log(turnCycle);

  const players = that.state.players,
    this_player = players[playerIndex(players, that.state.turn)];

  players.forEach((player) => {
    turnCycle["id" + player.id] = { choice: "", cards: [] };
  });

  if (
    cardsIncludeName(this_player.tableau, "elder_wand") ||
    this_player.character.fileName === "sirius_black"
  ) {
    turnCycle.shots = 9999;
  }

  return turnCycle;
};
