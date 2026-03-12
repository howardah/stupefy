import { Deck } from "../../../javascripts/deck";
import { playerIndex } from "../../utils/tools";
import { discard } from "../../utils/discard-cards";
import cloneDeep from "lodash/cloneDeep";

const isStupefy = (character, cards) => {
  if (cards.length > 1) {
    return { success: false, alert: "choose only one card!" };
  }

  switch (character) {
    case "ginny_weasley":
      if (cards[0].name === "stupefy" || cards[0].name === "protego")
        return { success: true, alert: "" };
    default:
      if (cards[0].name === "stupefy") return { success: true, alert: "" };
  }

  return { success: false, alert: "You must choose a stupefy card!" };
};

export const playStupefy = (that) => {
  const players = cloneDeep(that.state.players),
    target = players[playerIndex(players, that.state.player_id)],
    deck = new Deck([...that.state.deck.cards], [...that.state.deck.discards]),
    cards = that.state.turnCycle["id" + that.state.player_id].cards;

  if (!cards[0]) {
    that.addAlert("Choose a stupefy card first!");
  } else {
    let status = isStupefy(target.character.name, cards);

    if (status.success) {
      discard(target, deck, cards);
      return { state: { players, deck }, resolve: true };
    } else {
      that.addAlert(status.alert);
    }
  }
  return false;
};
