import { discardSelected } from "../utils/turn-tools";
import { takeHit } from "./spells/takeHit";
import { playStupefy } from "./spells/stupefy";
import { playerIndex, resolutionEvent, cardsIncludeName } from "../utils/tools";

export const dementors = {
  primary: (card, that, turnCycle) => {
    // Discard the selected card
    const state = discardSelected(that, turnCycle),
      instigator = state.players[playerIndex(state.players, that.state.turn)];

    // Figure out who is immune from the attack
    // and who isn’t
    let targets = [];

    that.state.players.forEach((player, i) => {
      if (player.id === instigator.id) return;
      if (that.state.deadPlayers.includes(player.id)) return;
      if (!cardsIncludeName(player.tableau, "expecto_patronum")) {
        targets.push(player.id);
      }
    });

    const dementorEvent = {
      popup: {
        message: "Dementors attack! Play a Stupefy card to fight them off!",
        options: [
          {
            label: "Take a hit",
            function: "takeHit",
          },
          {
            label: "Play a stupefy",
            function: "playStupefy",
          },
        ],
      },
      bystanders: {
        popupType: "subtle",
        message: "Whoosh, you’re past the Dementors now!",
        options: [],
      },
      instigator: instigator,
      cardType: "dementors",
      target: [...targets],
    };

    // Set the turn phase
    turnCycle.phase = "attack";

    const events = [...that.state.events];
    events.push(dementorEvent);
    return {
      state: { events, players: state.players, deck: state.deck },
      resolve: false,
    };
  },
  takeHit: takeHit,
  playStupefy: playStupefy,
  resolution: (that, lastAction) => {
    const instigator =
        that.state.players[playerIndex(that.state.players, that.state.turn)],
      subject =
        that.state.players[
          playerIndex(that.state.players, that.state.player_id)
        ];

    // Find out who all got hurt
    const damaged = [];

    that.state.players.forEach((player) => {
      console.log(that.state.turnCycle["id" + player.id]);
      if (that.state.turnCycle["id" + player.id]?.choice === "takeHit")
        damaged.push(player.character.shortName);
    });

    let message = "The Dementors have past. ";

    console.log(damaged);

    if (damaged.length === 1) {
      message += damaged[0] + " took damage.";
    } else if (damaged.length === 2) {
      message += damaged[0] + " and " + damaged[0] + " both took damage.";
    } else if (damaged.length > 2) {
      message +=
        damaged.slice(0, -1).join(", ") +
        ", and " +
        damaged.slice(-1) +
        " all took damage.";
    }
    return { event: resolutionEvent(message, [subject.id], message) };
  },
};
