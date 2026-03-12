import {
  playerIndex,
  resolutionEvent,
  cardsInclude,
  cardIndex,
  titleCase,
} from "../utils/tools";
import { Deck } from "../../javascripts/deck";
import cloneDeep from "lodash/cloneDeep";

export const expelliarmus = {
  primary: (given_subject, card, that, turnCycle) => {
    const players = cloneDeep(that.state.players),
      subject = players[playerIndex(players, given_subject.id)],
      instigator = players[playerIndex(players, that.state.player_id)],
      deck = new Deck(that.state.deck.cards, that.state.deck.discards),
      hand = cardsInclude(subject.hand, card),
      events = cloneDeep(that.state.events);

    deck.serveCards(
      subject[hand ? "hand" : "tableau"].splice(
        cardIndex(subject[hand ? "hand" : "tableau"], card),
        1
      )
    );
    deck.serveCards(
      instigator.hand.splice(cardIndex(instigator.hand, turnCycle.cards[0]), 1)
    );

    let personalText =
        instigator.character.shortName +
        " discarded your " +
        titleCase(card.name.replace("_", " ")) +
        ".",
      eventText =
        instigator.character.shortName +
        " discarded " +
        subject.character.shortName +
        "’s " +
        titleCase(card.name.replace("_", " ")) +
        ".";

    const event = resolutionEvent(personalText, [subject.id], eventText);

    events.push(event);

    return { state: { events, deck, players }, resolve: true };
  },
};
