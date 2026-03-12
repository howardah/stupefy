import {
  playerIndex,
  resolutionEvent,
  cardIndex,
  titleCase,
} from "../utils/tools";
import { Deck } from "../../javascripts/deck";
import cloneDeep from "lodash/cloneDeep";

export const ressurection_stone = {
  primary: (card, that, turnCycle) => {
    const deck = new Deck(...[that.state.deck.cards]),
      table = [...that.state.deck.discards];

    turnCycle.phase = "ressurection_stone-discards";
    return { deck, table, turnCycle };
  },
  secondary: (card, that, turnCycle) => {
    const players = cloneDeep(that.state.players),
      player = players[playerIndex(players, that.state.player_id)];
    let table = [...that.state.table];

    // Take the selected card from the table
    player.hand.unshift(table.splice(cardIndex(table, card))[0]);

    // Put all the cards back in the discard
    const deck = new Deck([...that.state.deck.cards], [...table]);
    // Empty the table
    table = [];

    // Create an event to tell everyone what happened
    let resolution = resolutionEvent(
      "You took a " +
        titleCase(card.name.replace("_", " ")) +
        " from the discard",
      [player.id],
      player.character.shortName +
        " ressurected a card from the discard with the Ressurection Stone"
    );

    // Add the event
    const events = [...that.state.events];
    events.push(resolution);

    // Add the stone of the used powers so
    // they can’t play it again this turn
    turnCycle.used.push("ressurection_stone");
    // They drew a card
    turnCycle.draw--;

    // Return state
    return { state: { events, deck, table, players }, resolve: true };
  },
};
