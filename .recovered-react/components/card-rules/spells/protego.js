import { Deck } from "../../../javascripts/deck";
import { playerIndex } from "../../utils/tools";
import { discard } from "../../utils/discard-cards";
import cloneDeep from "lodash/cloneDeep";

const isProtego = (character, cardname) => {
  switch (character) {
    case "luna_lovegood":
      return true;
    case "ginny_weasley":
      if (cardname === "stupefy" || cardname === "protego") return true;
    default:
      if (cardname === "protego") return true;
  }

  return false;
};

export const playProtego = (that) => {
  if (!that.state.turnCycle["id" + that.state.player_id]?.cards[0]) {
    that.addAlert("Choose a protego card first!");
  } else {
    const deck = new Deck(
        [...that.state.deck.cards],
        [...that.state.deck.discards]
      ),
      players = cloneDeep(that.state.players),
      player = players[playerIndex(players, that.state.player_id)],
      cards = that.state.turnCycle["id" + that.state.player_id].cards;

    let cardValidation = false,
      alert = "Wahoo!";

    if (cards.length > 2) {
    } else if (cards.length === 2) {
      // If there is more than one card selected

      //If the attacker is Bellatrix you need two cards!
      if (
        that.state.events[0].instigator.character.name === "bellatrix_lestrange"
      ) {
        // Check if all the cards are protego cards
        if (
          !cards.reduce((out, card) => {
            let final = out || true;
            if (typeof final !== "boolean")
              final = isProtego(player.character, final.name);
            return final === isProtego(player.character, final.name);
          })
        ) {
          //they played invalid cards
          cardValidation = false;
          alert = "Both cards must be (or work as) protego cards!";
        } else {
          //if they playerd two protego cards, they're good!
          cardValidation = true;
        }
      } else {
        cardValidation = false;
        alert = "You only need to play one card!";
      }
    } else {
      // If there is only one card selected
      if (isProtego(player.character, cards[0]?.name)) {
        cardValidation = true;
      } else {
        // See if players have special powers to help
        alert = "You must play a card that works as a protego charm!";
      }
    }

    if (!cardValidation) {
      that.addAlert(alert);
      return false;
    }

    if (cardValidation) {
      discard(player, deck, cards);
      return { state: { players, deck }, resolve: true };
    }
  }
};
