import { Deck } from "../../javascripts/deck";
import { playerIndex } from "../utils/tools";
import cloneDeep from "lodash/cloneDeep";
import { clearTable } from "../utils/clear-table";

export const endTurn = (that) => {
  const players = cloneDeep(that.state.players),
    currentIndex = playerIndex(players, that.state.turn),
    player = players[currentIndex];

  let change = {};

  //If player ends their turn in Jail, they're now free!
  if (player.tableau.some((e) => e.name === "azkaban")) {
    const jailLocation = player.tableau.findIndex((e) => e.name === "azkaban"),
      deck = new Deck(
        [...that.state.deck.cards],
        [...that.state.deck.discards]
      );

    deck.serveCard(player.tableau.splice(jailLocation, 1)[0]);
    change = { players, deck };
  }

  const clear = clearTable(that, change.deck);

  if (clear) {
    change = Object.assign(change, clear);
  }

  if (player.hand.length > player.character.health) {
    that.addAlert(
      "You must discard until you have at most the same number of cards as you do health"
    );
    return false;
  } else {
    return change;
  }
};
