import type { BoardViewState, CharacterPowerName, GameCard, PlayerState } from "../types";
import { getPrimaryCharacter } from "./core";

const HALLOWS = ["elder_wand", "invisibility_cloak", "resurrection_stone"] as const;

export function hasPower(
  player: PlayerState | null | undefined,
  powerName: CharacterPowerName,
): boolean {
  if (!player) {
    return false;
  }

  return player.power.includes(powerName);
}

export function hasTableauCard(player: PlayerState | null | undefined, cardName: string): boolean {
  if (!player) {
    return false;
  }

  return player.tableau.some((card) => card.name === cardName);
}

export function isMasterOfDeath(player: PlayerState | null | undefined): boolean {
  if (!player) {
    return false;
  }

  return HALLOWS.every((cardName) => hasTableauCard(player, cardName));
}

export function canUseHideCards(player: PlayerState | null | undefined): boolean {
  return !hasPower(player, "voldemort");
}

export function ignoresOpposingTableau(activePlayer: PlayerState | null | undefined): boolean {
  return hasPower(activePlayer, "albus_dumbledore");
}

export function handLimitForPlayer(player: PlayerState | null | undefined): number {
  if (!player) {
    return 0;
  }

  if (hasPower(player, "severus_snape")) {
    return 10;
  }

  return getPrimaryCharacter(player)?.health ?? 0;
}

export function isGrayCard(card: GameCard): boolean {
  return [
    "aspen_wand",
    "broomstick",
    "elder_wand",
    "expecto_patronum",
    "holly_wand",
    "invisibility_cloak",
    "larch_wand",
    "polyjuice_potion",
    "resurrection_stone",
    "vanishing_cabinet",
    "yew_wand",
  ].includes(card.name);
}

export function canUseDobbyPower(player: PlayerState | null | undefined): boolean {
  return hasPower(player, "dobby");
}

export function dobbyHasClothes(player: PlayerState | null | undefined): boolean {
  return Boolean(player && player.tableau.length >= 2);
}

export function copiedPowerName(
  player: PlayerState | null | undefined,
): CharacterPowerName | null {
  if (!player) {
    return null;
  }

  const primaryPower = getPrimaryCharacter(player)?.fileName;

  return (
    player.power.find(
      (power): power is CharacterPowerName => power !== primaryPower,
    ) ?? null
  );
}

export function canSeeRoleDetails(state: BoardViewState, subject: PlayerState): boolean {
  const viewer = state.players.find((player) => player.id === state.playerId);
  return Boolean(viewer && hasPower(viewer, "mad-eye_moody") && subject.role === "death eater");
}
