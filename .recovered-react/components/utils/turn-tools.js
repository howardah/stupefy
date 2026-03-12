import { endTurn } from "./end-turn";
import { clearTable } from "./clear-table";
import { setupCycle } from "./setup-cycle";
import { cycleBeginning } from "./cycle-beginning";
import { cycleCleanse } from "./cycle-cleanse";
import { discard } from "./discard-cards";
import { discardSelected } from "./turn-tools/discard-selected";
import { countAllCards } from "./turn-tools/count-cards";
import { universalOrder } from "./turn-tools/universal-order";
import { getNextTurn } from "./turn-tools/get-next-turn";

export const incrementTurn = (current_turn, turn_order, dead_players) => {
  console.log(current_turn, turn_order, dead_players);
  let turn = current_turn,
    turnIndex = turn_order.indexOf(turn);
  turnIndex++;
  if (turnIndex >= turn_order.length) turnIndex = 0;

  while (dead_players.includes(turn_order[turnIndex])) {
    turnIndex++;
    if (turnIndex >= turn_order.length) turnIndex = 0;
  }

  turn = turn_order[turnIndex];

  return turn;
};

export {
  endTurn,
  clearTable,
  setupCycle,
  cycleBeginning,
  cycleCleanse,
  discard,
  discardSelected,
  countAllCards,
  universalOrder,
  getNextTurn,
};
