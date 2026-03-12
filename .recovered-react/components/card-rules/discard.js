import { playerIndex, resolutionEvent, cardIndex } from "../utils/tools";
import { discard, cycleCleanse } from "../utils/turn-tools";
import { Deck } from "../../javascripts/deck";
import cloneDeep from "lodash/cloneDeep";
import { clone } from "lodash";

export const discardEvent = {
  primary: (that, turnCycle) => {
    const events = cloneDeep(that.state.events);
    let message = "Are you sure you want to discard this card?";

    if (turnCycle.cards.length > 1)
      message = "Are you sure you want to discard these cards?";

    // Create this player’s discard event
    let thisEvent = {
      popup: {
        popupType: "subtle",
        message: message,
        options: [
          { label: "yes", function: "dump" },
          { label: "no", function: "clear" },
        ],
      },
      instigator:
        that.state.players[
          playerIndex(that.state.players, that.state.player_id)
        ],
      cardType: "discard",
      target: [that.state.player_id],
    };

    events.push(thisEvent);

    // Change the play phase to match the event.
    // (Note, since we already have a copied version of turnCycle, which
    // will not effect the original if we return false from here we don't
    // need to copy it again or give it back in the returned object).

    turnCycle.phase = "discard";
    turnCycle.action = "discardEvent";

    // Return the state
    return {
      state: { events: events, turnCycle: turnCycle },
      resolve: false,
    };
  },
  dump: (that, index, turnCycle) => {
    const players = cloneDeep(that.state.players),
      player = players[playerIndex(players, that.state.player_id)],
      events = cloneDeep(that.state.events),
      deck = new Deck(
        [...that.state.deck.cards],
        [...that.state.deck.discards]
      );

    discard(player, deck, turnCycle.cards);

    events.shift();

    cycleCleanse(turnCycle, that);

    return { state: { deck, players, events }, resolve: false };
  },
  clear: (that, index, turnCycle) => {
    const events = cloneDeep(that.state.events);

    events.shift();

    turnCycle.phase = "selected";
    if (turnCycle.cards.length === 1) {
      turnCycle.action = turnCycle.cards[0].name;
    } else if (
      turnCycle.cards.length === 2 &&
      turnCycle.cards.some((card) => card.name === "stupefy") &&
      turnCycle.cards.some((card) => card.name === "felix_felicis")
    ) {
      turnCycle.action = "felix";
    } else {
      turnCycle.action = "discard";
    }

    // Return state
    return { state: { events }, resolve: false };
  },
};
