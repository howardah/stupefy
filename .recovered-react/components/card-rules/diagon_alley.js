import { playerIndex, resolutionEvent, cardIndex } from "../utils/tools";
import { discardSelected } from "../utils/turn-tools";
import { Deck } from "../../javascripts/deck";
import cloneDeep from "lodash/cloneDeep";

export const diagon_alley = {
  primary: (card, that, turnCycle) => {
    // Discard the selected card
    const state = discardSelected(that, turnCycle),
      instigator = state.players[playerIndex(state.players, that.state.turn)];

    // Deal out a card for each living player and attach an event
    // for each of those players
    const events = [],
      table = cloneDeep(that.state.table),
      turnOrder = that.state.turnOrder,
      deadPlayers = that.state.deadPlayers;

    for (let i = 0; i < turnOrder.length; i++) {
      // Starting with the current player
      let currentIndex = i + turnOrder.indexOf(that.state.turn);
      if (currentIndex >= turnOrder.length)
        currentIndex = currentIndex - turnOrder.length;

      // If the player is dead, don't include them
      if (deadPlayers.includes(turnOrder[currentIndex])) continue;

      // Place a card on the table
      table.push(state.deck.drawCard());

      // Compose messages
      let mainMessage =
        currentIndex === 0
          ? "Diagon Alley! Take a card from the table!"
          : instigator.character.shortName +
            " has played Diagon Alley! Your turn to take a card!";

      let waitMessage =
        currentIndex === 0
          ? "Everyone else is choosing their cards."
          : instigator.character.shortName + " has played Diagon Alley!";

      // Create this player’s draw event
      let thisEvent = {
        popup: {
          popupType: "subtle",
          message: mainMessage,
          options: [],
        },
        bystanders: {
          popupType: "subtle",
          message: waitMessage,
          options: [],
        },
        instigator: instigator,
        cardType: "diagon_alley",
        target: [turnOrder[currentIndex]],
      };

      events.push(thisEvent);
    }

    // Change the play phase to match the event.
    // (Note, since we already have a copied version of turnCycle, which
    // will not effect the original if we return false from here we don't
    // need to copy it again or give it back in the returned object).
    turnCycle.phase = "diagon_alley";

    // Return the state
    return {
      state: { players: state.players, deck: state.deck, events, table },
      resolve: false,
    };
  },
  secondary: (card, that, turnCycle) => {
    const players = cloneDeep(that.state.players),
      player = players[playerIndex(players, that.state.player_id)],
      table = cloneDeep(that.state.table),
      events = cloneDeep(that.state.events);

    // Grab the card from the table
    player.hand.unshift(table.splice(cardIndex(table, card), 1)[0]);

    // Remove this event
    events.shift();

    // Check if this is the last player.
    let lastPlayer = false;
    if (events.length === 0) {
      // If so, then set the resolution event
      let message = "All players have taken their cards from Diagon Alley!";
      let resolution = resolutionEvent(message, [player.id], message);

      events.unshift(resolution);
      lastPlayer = true;
    }

    // Return state
    return { state: { table, players, events }, resolve: lastPlayer };
  },
};
