import { playerIndex } from "../../utils/tools";
import { discard } from "../discard-cards";
import { Deck } from "../../../javascripts/deck";
import { cloneDeep } from "lodash";

export const discardSelected = (that, turnCycle) => {
  const players = cloneDeep(that.state.players),
    player = players[playerIndex(players, that.state.turn)],
    deck = new Deck([...that.state.deck.cards], [...that.state.deck.discards]);

  if (turnCycle === undefined) turnCycle = cloneDeep(that.state.turnCycle);

  discard(player, deck, turnCycle.cards);

  return { players, deck };
};
