import { Deck } from "../../javascripts/deck";
import { playerIndex } from "../utils/tools";
import cloneDeep from "lodash/cloneDeep";

export const clearTable = (that, given_deck, number) => {
  const table = cloneDeep(that.state.table);

  if (table.length === 0) return false;
  const deck = given_deck
    ? new Deck(given_deck.cards, given_deck.discards)
    : new Deck(that.state.deck.cards, that.state.deck.discards);

  let event = {};

  if (number === undefined) number = table.length;
  for (let i = number; i > 0; i--) {
    deck.serveCard(table.splice(table.length - 1, 1)[0]);
  }

  event.table = table;
  event.deck = deck;

  return event;
};
