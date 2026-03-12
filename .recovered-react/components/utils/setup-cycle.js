import { playerIndex, cardsIncludeName } from "../utils/tools";

export const setupCycle = (that, turn) => {
  if (that.state.turnCycle.phase === "unset") return that.state.turnCycle;
  let turnCycle = {
      action: "",
      cards: [],
      felix: [],
      draw: 2,
      hotseat: -1,
      phase: "initial",
      shots: 1,
      used: [],
    },
    returnState = {};

  console.log(turn);

  const players = that.state.players,
    this_player = players[playerIndex(players, turn)];

  players.forEach((player) => {
    turnCycle["id" + player.id] = { cards: [] };
  });

  if (
    cardsIncludeName(this_player.tableau, "elder_wand") ||
    this_player.character.fileName === "sirius_black"
  ) {
    turnCycle.shots = 9999;
  }

  if (cardsIncludeName(this_player.tableau, "azkaban")) {
    // If the player is in Azkaban start an
    // Azkaban event.
    turnCycle.phase = "azkaban";
    const events = [
      {
        popup: {
          message: "You’re in Azkaban! Draw a card to see if you get out",
          options: [],
          popupType: "subtle",
        },
        bystanders: {
          popupType: "subtle",
          message:
            this_player.character.shortName +
            " is in Azkaban! They must draw to see if they get out.",
          options: [],
        },
        instigator: this_player,
        cardType: "azkaban",
        target: [turn],
      },
    ];

    returnState.events = events;
  }

  returnState.turnCycle = turnCycle;

  return returnState;
};
