import { checkTopCard } from "../../utils/checkTopCard";
import { playerIndex } from "../../utils/tools";
import cloneDeep from "lodash/cloneDeep";

export const invisibilityCloak = (that, index) => {
  const players = [...that.state.players],
    thisPlayer = players[playerIndex(players, that.state.player_id)];

  let house = thisPlayer.character.house,
    oneBefore = that.state.turnOrder.indexOf(that.state.player_id) - 1;

  // Make sure the character has a house to be drawing for
  if (oneBefore < 0) oneBefore += that.state.turnOrder.length;
  if (house === "")
    house =
      that.state.players[that.findMe(that.state.turnOrder[oneBefore])].character
        .house;

  if (house === "") house = "H";

  const houses = ["H", "S", "G", "R"];

  houses.splice(houses.indexOf(house), 1);

  const events = cloneDeep(that.state.events),
    options = events[0].popup.options,
    topCard = checkTopCard(houses, that.state.deck, that.state.table);

  if (topCard.gotit) {
    that.addAlert(
      "Hooray! You drew a " + topCard.house + ", and the spell missed"
    );
    return { state: { deck: topCard.deck }, resolve: true };
  } else {
    options.splice(index, 1);
    that.addAlert("Bummer! You drew a " + topCard.house + ".");
    return { state: { events, deck: topCard.deck }, resolve: false };
  }
};
