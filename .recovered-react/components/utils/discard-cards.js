import { Deck } from "../../javascripts/deck";
import { cardIndex } from "./tools";
export const discard = (player, deck, cards) => {
  for (let i = 0; i < cards.length; i++) {
    let location = "hand",
      thisIndex = cardIndex(player.hand, cards[i]);

    if (thisIndex === -1) {
      location = "tableau";
      thisIndex = cardIndex(player.tableau, cards[i]);
    }

    deck.serveCards(player[location].splice(thisIndex, 1));
  }
};
