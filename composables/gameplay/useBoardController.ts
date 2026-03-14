import type { ComputedRef } from "vue";
import type { BoardViewState } from "~/utils/types";
import { rotatePlayersForViewer } from "~/utils/gameplay/board-ui";
import { getPopupState } from "~/utils/gameplay/events";
import { getAvailableTargets, getCardTargets } from "~/utils/gameplay/targeting";
import { useBoardAlerts } from "./board-controller/useBoardAlerts";
import { useBoardInteractions } from "./board-controller/useBoardInteractions";
import { useBoardPowerActions } from "./board-controller/useBoardPowerActions";
import { useBoardSelections } from "./board-controller/useBoardSelections";
import { useBoardStateSync } from "./board-controller/useBoardStateSync";
import { useBoardTurnActions } from "./board-controller/useBoardTurnActions";

const POPUP_EMPTY = { canDismiss: true, message: "", options: [] };

export function useBoardController(sourceBoardState: ComputedRef<BoardViewState | null>) {
  const { alerts, clearAlerts, pushAlert, removeAlert } = useBoardAlerts();
  const { boardState, mutationNonce, resetBoard, withBoardState } = useBoardStateSync(
    sourceBoardState,
    pushAlert,
    clearAlerts,
  );

  const orderedPlayers = computed(() =>
    boardState.value
      ? rotatePlayersForViewer(boardState.value.players, boardState.value.playerId)
      : [],
  );
  const currentActions = computed(() =>
    boardState.value
      ? getPopupState(boardState.value.events, boardState.value.playerId)
      : POPUP_EMPTY,
  );
  const availableTargets = computed(() =>
    boardState.value ? getAvailableTargets(boardState.value) : [],
  );
  const actionTargets = computed(() =>
    boardState.value
      ? getCardTargets(boardState.value.turnCycle.action, boardState.value.turnCycle)
      : [],
  );
  const isMyTurn = computed(() =>
    Boolean(boardState.value && boardState.value.turn === boardState.value.playerId),
  );
  const canEndTurn = computed(() =>
    Boolean(
      boardState.value &&
      boardState.value.turn === boardState.value.playerId &&
      (boardState.value.turnCycle.phase === "initial" ||
        boardState.value.turnCycle.phase === "stuck-in-azkaban"),
    ),
  );
  const choosingCharacter = computed(() => {
    const currentPlayer = orderedPlayers.value[0];
    return Boolean(currentPlayer && Array.isArray(currentPlayer.character));
  });

  const selections = useBoardSelections(pushAlert);
  const { powerActions } = useBoardPowerActions(boardState);
  const interactions = useBoardInteractions({
    actionTargets,
    orderedPlayers,
    pushAlert,
    selections,
    withBoardState,
  });
  const turnActions = useBoardTurnActions({
    boardState,
    canEndTurn,
    pushAlert,
    selections,
    withBoardState,
  });

  return {
    actionTargets,
    actions: currentActions,
    alerts,
    availableTargets,
    boardState,
    canEndTurn,
    chooseAction: turnActions.chooseAction,
    chooseCharacter: turnActions.chooseCharacter,
    choosingCharacter,
    clearResolutionAction: turnActions.clearResolutionAction,
    endTurn: turnActions.endTurn,
    handleApparate: interactions.handleApparate,
    handleCharacterClick: interactions.handleCharacterClick,
    handleDeckClick: interactions.handleDeckClick,
    handleHandClick: interactions.handleHandClick,
    handleTableClick: interactions.handleTableClick,
    handleTableauClick: interactions.handleTableauClick,
    isMyTurn,
    mutationNonce,
    orderedPlayers,
    powerActions,
    removeAlert,
    resetBoard,
    toggleCards: interactions.toggleCards,
    usePowerAction: turnActions.usePowerAction,
  };
}
