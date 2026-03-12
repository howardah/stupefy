import { Deck } from "../../javascripts/deck";

export const checkTopCard = (house, this_deck) => {
  const deck = new Deck([...this_deck.cards], [...this_deck.discards]),
    houses = {
      G: "Griffindor",
      S: "Slytherine",
      H: "Hufflepuff",
      R: "Ravenclaw",
    };

  deck.serveCard(deck.drawCard());

  let gotit = false,
    checked = houses[deck.discards[0].house];

  house.forEach((h) => {
    if (deck.discards[0].house === h) {
      gotit = true;
      checked = houses[h];
    }
  });

  return { gotit: gotit, house: checked, deck };
};
