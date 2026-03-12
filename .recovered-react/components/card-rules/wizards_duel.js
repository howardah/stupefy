import { takeHit } from "./spells/takeHit";
import { playStupefy } from "./spells/stupefy";
import { playerIndex, resolutionEvent } from "../utils/tools";
import { discardSelected } from "../utils/turn-tools";
import cloneDeep from "lodash/cloneDeep";
import { stupefy } from "./stupefy";

export const wizards_duel = {
  primary: (subject, that, turnCycle) => {
    // Discard the selected card
    const state = discardSelected(that, turnCycle),
      instigator = state.players[playerIndex(state.players, that.state.turn)];

    // Setup the challenge event
    const events = [
      {
        popup: {
          message:
            instigator.character.shortName +
            " has challanged you to a Wizard’s Duel!",
          options: [
            { label: "Take a hit", function: "takeHit" },
            { label: "Play Stupefy", function: "duel" },
          ],
        },
        ["bystanders-" + instigator.id]: {
          popupType: "subtle",
          message:
            "You have challenged " +
            subject.character.shortName +
            " to a Wizard’s Duel!",
          options: [],
        },
        bystanders: {
          popupType: "subtle",
          message:
            instigator.character.shortName +
            " has challenged " +
            subject.character.shortName +
            " to a Wizard’s Duel!",
          options: [],
        },
        instigator: instigator,
        cardType: "wizards_duel",
        target: [subject.id],
      },
    ];

    // Return state
    return {
      state: { events, players: state.players, deck: state.deck },
      resolve: false,
    };
  },
  takeHit: takeHit,
  duel: (that, index, turnCycle) => {
    const stupefy = playStupefy(that);

    // Don’t move on if they didn’t play a stupefy
    if (!stupefy) return false;

    // If they play a stupefy, then give the instigator
    // a response event

    const events = cloneDeep(that.state.events),
      thisPlayer =
        stupefy.state.players[
          playerIndex(stupefy.state.players, that.state.player_id)
        ],
      thatPlayer = events[0].instigator;

    // Figure out whose turn it is so we can tell everyone
    // what’s going on.
    const thisTurn =
      thisPlayer.id ===
      stupefy.state.players[playerIndex(stupefy.state.players, that.state.turn)]
        .id;

    // Write the message for the watchers.
    let message =
      (thisTurn
        ? thisPlayer.character.shortName
        : thisPlayer.character.shortName) +
      " and " +
      (thisTurn
        ? thatPlayer.character.shortName
        : thisPlayer.character.shortName) +
      " are fighting a Wizard’s Duel! " +
      thisPlayer.character.shortName +
      " just cast a Stupefy charm at " +
      thatPlayer.character.shortName +
      ".";

    // Create the response event
    const response = {
      popup: {
        message:
          thisPlayer.character.shortName + " has cast a Stupefy back at you!",
        options: [
          { label: "Take a hit", function: "takeHit" },
          { label: "Play Stupefy", function: "duel" },
        ],
      },
      ["bystanders-" + thisPlayer.id]: {
        popupType: "subtle",
        message:
          "You’ve cast a Stupefy at " + thatPlayer.character.shortName + "!",
        options: [],
      },
      bystanders: {
        popupType: "subtle",
        message: message,
        options: [],
      },
      instigator: thisPlayer,
      cardType: "wizards_duel",
      target: [thatPlayer.id],
    };

    // Remove the current event
    events.shift();

    // Add the new event
    events.push(response);

    // Remove from selected cards
    turnCycle["id" + that.state.player_id].cards = [];

    // Return the state
    return {
      state: Object.assign(stupefy.state, { events }),
      resolve: false,
    };
  },
  resolution: (that, lastAction) => {
    // Figure out who won and who lost the duel
    const players = that.state.players,
      winner =
        players[playerIndex(players, that.state.events[0].instigator.id)],
      loser = players[playerIndex(players, that.state.events[0].target[0])];

    // Set a message for the duelers and the watchers
    let winnerText =
        "You beat " + loser.character.shortName + " in a Wizard’s Duel.",
      loserText = winner.character.shortName + " beat you in a Wizard’s Duel.",
      watcherText =
        winner.character.shortName +
        " beat " +
        loser.character.shortName +
        " in a Wizard’s Duel.";

    // Create the resolution event
    const resolution = resolutionEvent(winnerText, [winner.id], watcherText);

    // Add the loser’s message
    resolution["bystanders-" + loser.id] = {
      popupType: "resolution",
      message: loserText,
      options: [],
    };

    // Return the event
    return { event: resolution };
  },
};
