import type { ComputedRef } from "vue";
import type { BoardViewState } from "@shared/utils/types";
import {
  canUseDobbyPower,
  copiedPowerName,
  dobbyHasClothes,
  hasPower,
  isGrayCard,
} from "@shared/utils/gameplay/powers";
import { viewerPlayer } from "./helpers";

function useBoardPowerActions(boardState: ComputedRef<BoardViewState | null>) {
  const powerActions = computed(() => {
    if (!boardState.value) {
      return [];
    }

    const player = viewerPlayer(boardState.value);
    if (!player) {
      return [];
    }

    const actions: Array<{ id: string; label: string }> = [];
    const selectedCards = boardState.value.turnCycle.cards;
    const isTurnPlayer = boardState.value.turn === player.id;
    const copiedPower = copiedPowerName(player);

    if (isTurnPlayer && boardState.value.turnCycle.phase === "initial") {
      if (
        hasPower(player, "james_potter") &&
        !boardState.value.turnCycle.used.includes("james_potter")
      ) {
        actions.push({ id: "james_potter", label: "James: Lose 1, draw 2" });
      }

      if (canUseDobbyPower(player) && !boardState.value.turnCycle.used.includes("dobby_stupefy")) {
        actions.push({
          id: dobbyHasClothes(player) ? "dobby_stupefy" : "dobby_punish_stupefy",
          label: dobbyHasClothes(player) ? "Dobby: Free Stupefy" : "Dobby: Self-hit Stupefy",
        });
      }

      if (
        (hasPower(player, "nymphadora_tonks") || copiedPower === "nymphadora_tonks") &&
        !boardState.value.turnCycle.used.includes("tonks_copy")
      ) {
        actions.push({ id: "tonks_copy", label: "Tonks: Copy power" });
      }
    }

    if (
      isTurnPlayer &&
      (boardState.value.turnCycle.phase === "initial" ||
        boardState.value.turnCycle.phase === "selected") &&
      selectedCards.length === 2 &&
      hasPower(player, "fenrir_greyback")
    ) {
      actions.push({ id: "fenrir_stupefy", label: "Fenrir: 2-card Stupefy" });
    }

    if (
      isTurnPlayer &&
      (boardState.value.turnCycle.phase === "initial" ||
        boardState.value.turnCycle.phase === "selected") &&
      selectedCards.length === 2 &&
      hasPower(player, "neville_longbottom")
    ) {
      actions.push({ id: "neville_longbottom", label: "Neville: Heal 1" });
    }

    if (
      isTurnPlayer &&
      (boardState.value.turnCycle.phase === "initial" ||
        boardState.value.turnCycle.phase === "selected") &&
      selectedCards.length === 1 &&
      hasPower(player, "minerva_mchonagall") &&
      isGrayCard(selectedCards[0]!) &&
      boardState.value.turnCycle.used.filter((entry) => entry === "minerva_mchonagall").length < 2
    ) {
      actions.push({ id: "minerva_mchonagall", label: "Minerva: Discard gray, draw 2" });
    }

    if (
      selectedCards.length === 1 &&
      selectedCards[0]?.name === "protego" &&
      hasPower(player, "molly_weasley")
    ) {
      actions.push({ id: "molly_protego", label: "Molly: Give Protego" });
    }

    return actions;
  });

  return { powerActions };
}

export { useBoardPowerActions };
