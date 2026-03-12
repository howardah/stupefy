import { playerIndex, resolutionEvent, cardIndex } from "../utils/tools";
import { discardSelected } from "../utils/turn-tools";
import { Deck } from "../../javascripts/deck";

export const honeydukes = {
  primary: (card, that, turnCycle) => {
    // Discard the selected card
    const state = discardSelected(that, turnCycle),
      player = state.players[playerIndex(state.players, that.state.player_id)];

    // Give the player the power to draw two more cards
    // (Note, since we already have a copied version of turnCycle, which
    // will not effect the original if we return false from here we don't
    // need to copy it again or give it back in the returned object).
    turnCycle.draw += 2;

    // Set the resolution message
    let personalText =
        "You have played Honeydukes and get to draw two more cards",
      eventText =
        player.character.shortName +
        "has played Honeydukes and gets to draw two more cards";
    const events = [resolutionEvent(personalText, [player.id], eventText)];

    // Return the state
    return {
      state: { players: state.players, deck: state.deck, events },
      resolve: true,
    };
  },
};
