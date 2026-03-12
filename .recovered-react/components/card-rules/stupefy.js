import { discardSelected } from "../utils/turn-tools";
import { playProtego } from "./spells/protego";
import { takeHit } from "./spells/takeHit";
import { houseHide } from "./spells/houseHide";
import { invisibilityCloak } from "./spells/invisibilityCloak";
import { protegoOptions } from "../utils/character-events";
import { playerIndex, resolutionEvent } from "../utils/tools";
import cloneDeep from "lodash/cloneDeep";

export const stupefy = {
  primary: (subject, that, turnCycle) => {
    // Discard the selected card
    const state = discardSelected(that, turnCycle),
      instigator = state.players[playerIndex(state.players, that.state.turn)];

    // Each player is only allowed one Stupefy per turn
    turnCycle.shots--;

    // The base response options
    let popupOptions = [
      { label: "Take a hit", function: "takeHit" },
      { label: "Play Protego", function: "playProtego" },
    ];

    // Get special case resonses
    popupOptions = protegoOptions(subject, popupOptions);

    // Setup the event
    const events = [
      {
        popup: {
          message:
            instigator.character.shortName + " has fired a stupefy at you!",
          options: [...popupOptions],
        },
        instigator: instigator,
        cardType: "stupefy",
        target: [subject.id],
        bystanders: {
          message:
            instigator.character.shortName +
            " has fired a stupefy at " +
            subject.character.shortName +
            "!",
          options: [],
          popupType: "subtle",
        },
        ["bystanders" + instigator.id]: {
          message:
            "You have fired a stupefy at " + subject.character.shortName + "!",
          options: [],
          popupType: "subtle",
        },
      },
    ];

    // Return the state
    return {
      state: { events, players: state.players, deck: state.deck },
      resolve: false,
    };
  },
  takeHit: takeHit,
  playProtego: playProtego,
  houseHide: houseHide,
  invisibilityHide: invisibilityCloak,
  clearEvent: () => {
    console.log("Woosh!");
    return { state: {}, resolve: true };
  },
  resolution: (that, lastAction) => {
    const instigator =
        that.state.players[playerIndex(that.state.players, that.state.turn)],
      subject =
        that.state.players[
          playerIndex(that.state.players, that.state.turnCycle.hotseat)
        ];

    let personalText = "";
    let eventText = "";

    switch (lastAction) {
      case "houseHide":
        personalText = "You have successfully hidden and the spell missed";
        eventText =
          subject.character.shortName +
          " has hidden in their vanishing cabinet and " +
          instigator.character.shortName +
          "’s stupefy missed.";
        break;
      case "takeHit":
        personalText = "You have taken a hit!";
        eventText =
          subject.character.shortName +
          " has been hit by " +
          instigator.character.shortName +
          "’s stupefy.";
        break;
      case "playProtego":
        personalText = "You have successfully cast a protego";
        eventText =
          subject.character.shortName +
          " used a Protego charm and blocked " +
          instigator.character.shortName +
          "’s Stupefy.";
        break;
      case "invisibilityHide":
        personalText = "You have successfully hidden and the spell missed";
        eventText =
          subject.character.shortName +
          " has hidden in their invisibility cloak and " +
          instigator.character.shortName +
          "’s stupefy missed.";
        break;
      case "clearEvent":
        personalText = "The spell missed";
        eventText =
          subject.character.shortName +
          " is untouchable and " +
          instigator.character.shortName +
          "’s stupefy missed.";
        break;
      default:
        break;
    }

    return { event: resolutionEvent(personalText, [subject.id], eventText) };
  },
};
