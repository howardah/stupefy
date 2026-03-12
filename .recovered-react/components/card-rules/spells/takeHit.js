import { playerIndex } from "../../utils/tools";
import cloneDeep from "lodash/cloneDeep";

export const takeHit = (that) => {
  const players = cloneDeep(that.state.players),
    thatIndex = playerIndex(players, that.state.player_id);

  players[thatIndex].character.health--;

  return { state: { players }, resolve: true };
};
