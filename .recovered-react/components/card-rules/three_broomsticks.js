import { playerIndex, resolutionEvent } from "../utils/tools";
import { discardSelected } from "../utils/turn-tools";
import cloneDeep from "lodash/cloneDeep";

export const three_broomsticks = {
  primary: (card, that, turnCycle) => {
    // Discard the selected card
    const state = discardSelected(that, turnCycle),
      bartender = state.players[playerIndex(state.players, that.state.turn)],
      events = cloneDeep(that.state.events);

    // Heal each player by one
    state.players.forEach((player) => {
      // Make sure they’re not at max-health already
      if (player.character.health < player.character.maxHealth)
        player.character.health++;
    });

    // Let everyone know what happened
    let personalText =
        "You played the Three Broomsticks and everyone has been healed for 1 point!",
      eventText =
        bartender.character.shortName +
        " played the Three Broomsticks and everyone has been healed for 1 point!";

    // set the event
    const event = resolutionEvent(personalText, [bartender.id], eventText);

    // Add it to current events
    events.push(event);

    // Return the state
    return {
      state: { events, players: state.players, deck: state.deck },
      resolve: true,
    };
  },
};
