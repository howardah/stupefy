import { playerIndex, resolutionEvent, cardIndex } from "../utils/tools";
import { discardSelected } from "../utils/turn-tools";
import { Deck } from "../../javascripts/deck";

export const weasleys_wizard_weezes = {
  primary: (card, that, turnCycle) => {
    // Discard the selected card
    const state = discardSelected(that, turnCycle),
      player = state.players[playerIndex(state.players, that.state.player_id)];

    // Give the player the power to draw two more cards
    // (Note, since we already have a copied version of turnCycle, which
    // will not effect the original if we return false from here we don't
    // need to copy it again or give it back in the returned object).
    turnCycle.draw += 3;

    // Set the resolution message
    let personalText =
        "You have played Weasleys’ Wizard Weezes and get to draw three more cards!",
      eventText =
        player.character.shortName +
        "has played Weasleys’ Wizard Weezes and gets to draw three more cards";
    const events = [resolutionEvent(personalText, [player.id], eventText)];

    // Return the state
    return {
      state: { players: state.players, deck: state.deck, events },
      resolve: true,
    };
  },
};
