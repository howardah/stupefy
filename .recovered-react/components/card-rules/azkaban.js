import { checkTopCard } from "../utils/checkTopCard";
import { playerIndex, resolutionEvent, cardsIndexName } from "../utils/tools";
import cloneDeep from "lodash/cloneDeep";
import { Deck } from "../../javascripts/deck";

export const azkaban = (that, turnCycle) => {
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

  // Draw to see if they get their house
  const events = cloneDeep(that.state.events),
    topCard = checkTopCard([house], that.state.deck, that.state.table);

  // Remove current Azkaban status
  events.shift();

  // Setup the resolution event accordingly
  let resolution = {};

  // Figure out what to tell everyone
  if (topCard.gotit) {
    let message =
        "Hooray! You drew a " + topCard.house + " and escaped Azkaban",
      watcherMessage =
        thisPlayer.character.shortName +
        " drew a " +
        topCard.house +
        " and escaped Azkaban";

    resolution = resolutionEvent(message, [thisPlayer.id], watcherMessage);

    topCard.deck.serveCard(
      thisPlayer.tableau.splice(
        cardsIndexName(thisPlayer.tableau, "azkaban"),
        1
      )[0]
    );
  } else {
    let message =
        "Bummer! You drew a " +
        topCard.house +
        " and are still in Azkaban. You’ve lost this turn.",
      watcherMessage =
        thisPlayer.character.shortName +
        " failed to escape Azkaban and their turn has been skipped.";

    resolution = resolutionEvent(message, [thisPlayer.id], watcherMessage);
  }

  // Put the resolution event into the queue
  events.push(resolution);

  // Return the state
  return {
    state: { events, deck: topCard.deck },
    gotit: topCard.gotit,
    resolve: true,
  };
};
