import { playerIndex, resolutionEvent } from "../utils/tools";
import { discardSelected } from "../utils/turn-tools";
import cloneDeep from "lodash/cloneDeep";

export const butterbeer = {
  primary: (given_subject, that, turnCycle) => {
    // Discard the selected card
    const state = discardSelected(that, turnCycle),
      subject = state.players[playerIndex(state.players, given_subject.id)],
      events = cloneDeep(that.state.events);

    // If the character is at max health. Abort, and don't merge
    // the modified state
    if (subject.character.health >= subject.character.maxHealth) {
      that.addAlert("You’re already at max health!");
      return false;
    }

    // Heal the player by one
    subject.character.health++;

    // If they’re Hagrid, they get healed for two
    if (
      subject.power.includes("rubeus_hagrid") &&
      subject.character.health >= subject.character.maxHealth
    )
      subject.character.health++;

    // Let everyone know what happened
    let personalText = "You drank butterbeer and were healed for 1 point!",
      eventText =
        subject.character.shortName +
        " drank butterbeer and was healed for 1 point!";

    // set the event
    const event = resolutionEvent(personalText, [subject.id], eventText);

    // Add it to current events
    events.push(event);

    // Return the state
    return {
      state: { events, players: state.players, deck: state.deck },
      resolve: true,
    };
  },
};
