import cloneDeep from "lodash/cloneDeep";
import { playerIndex } from "../../utils/tools";

export const sortPlayers = (given_players, given_order) => {
  const players = cloneDeep(given_players),
    newPlayers = [];

  given_order.forEach((id) => {
    newPlayers.push(players[playerIndex(players, id)]);
  });

  return newPlayers;
};
