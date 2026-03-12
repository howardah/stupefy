import {
  playerIndex,
  resolutionEvent,
  cardsInclude,
  cardIndex,
  titleCase,
} from "../utils/tools";
import { Deck } from "../../javascripts/deck";
import { discardSelected } from "../utils/turn-tools";
import cloneDeep from "lodash/cloneDeep";

export const accio = {
  primary: (given_subject, card, that, turnCycle) => {
    // Discard the selected card
    const state = discardSelected(that, turnCycle);

    // Gather info on the stealer and the victim
    const subject = state.players[playerIndex(state.players, given_subject.id)],
      instigator =
        state.players[playerIndex(state.players, that.state.player_id)],
      // is the card in their hand or on their tableau
      hand = cardsInclude(subject.hand, card),
      events = cloneDeep(that.state.events);

    // Steal card
    instigator.hand.unshift(
      subject[hand ? "hand" : "tableau"].splice(
        cardIndex(subject[hand ? "hand" : "tableau"], card),
        1
      )[0]
    );

    // Tell everyone what happened
    let personalText =
        instigator.character.shortName +
        " used a summoning charm to steal your " +
        titleCase(card.name.replace("_", " ")) +
        ".",
      eventText =
        instigator.character.shortName +
        " used a summoning charm to steal " +
        (hand ? " from " : "") +
        subject.character.shortName +
        "’s " +
        (hand ? " hand." : titleCase(card.name.replace("_", " ")) + ".");

    const event = resolutionEvent(personalText, [subject.id], eventText);

    // Replace the instigators name with 2nd person pronoun for them
    event["bystanders-" + instigator.id] = {
      popupType: "resolution",
      message: eventText.replace(instigator.character.shortName, "You"),
      options: [],
    };

    events.push(event);

    // Return state
    return {
      state: { events, deck: state.deck, players: state.players },
      resolve: true,
    };
  },
};
