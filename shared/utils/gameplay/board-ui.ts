import type { BoardViewState, GameCard, GameplayTarget, PlayerState } from "../types";
import { getPrimaryCharacter } from "./core";
import { ignoresOpposingTableau } from "./powers";

export const EMPTY_CARD: GameCard = {
  fileName: "",
  house: "",
  name: "",
  power: {},
};

export function rotatePlayersForViewer(players: PlayerState[], viewerId: number): PlayerState[] {
  const index = players.findIndex((player) => player.id === viewerId);

  if (index <= 0) {
    return [...players];
  }

  return [...players.slice(index), ...players.slice(0, index)];
}

export function checkPlayerDistance(
  orderedPlayers: PlayerState[],
  viewerId: number,
  targetPlayerId: number,
  rangeOverride?: number,
): boolean {
  const alivePlayers = orderedPlayers.filter((player) => {
    const character = getPrimaryCharacter(player);
    return Boolean(character && character.health > 0);
  });
  const activePlayer = alivePlayers.find((player) => player.id === viewerId);
  const thisIndex = alivePlayers.findIndex((player) => player.id === targetPlayerId);

  if (!activePlayer || thisIndex === -1) {
    return false;
  }

  let range = rangeOverride ?? 1;

  for (const card of activePlayer.tableau) {
    if (card.power?.distance !== undefined) {
      const distance = Number(card.power.distance);
      range += distance > 0 ? 0 : -distance;
    }

    if (rangeOverride !== undefined) continue;

    if (card.power?.range !== undefined) {
      range += Number(card.power.range) - 1;
    }
  }

  if (getPrimaryCharacter(activePlayer)?.fileName === "remus_lupin") {
    range += 1;
  }

  const targetPlayer = alivePlayers[thisIndex];
  if (!ignoresOpposingTableau(activePlayer)) {
    for (const card of targetPlayer?.tableau || []) {
      if (card.power?.distance !== undefined) {
        const distance = Number(card.power.distance);
        range -= distance > 0 ? distance : 0;
      }
    }
  }

  return thisIndex <= range || alivePlayers.length - thisIndex <= range;
}

export function isHandTargetClickable(
  player: PlayerState,
  viewerId: number,
  targets: GameplayTarget[],
  orderedPlayers: PlayerState[],
): boolean {
  if (targets.includes("range") && !checkPlayerDistance(orderedPlayers, viewerId, player.id, 1)) {
    return false;
  }

  if (player.id === viewerId && targets.includes("my-hand")) return true;
  if (player.id !== viewerId && targets.includes("hand")) return true;

  return false;
}

export function isTableauTargetClickable(
  player: PlayerState,
  viewerId: number,
  targets: GameplayTarget[],
  orderedPlayers: PlayerState[],
  card: GameCard,
): boolean {
  if (card.fileName === "azkaban") return false;

  if (targets.includes("range") && !checkPlayerDistance(orderedPlayers, viewerId, player.id, 1)) {
    return false;
  }

  if (player.id === viewerId) {
    if (card.fileName !== "" && targets.includes("my-tableau")) return true;
    if (card.fileName === "" && targets.includes("my-tableau-empty")) return true;
  }

  if (player.id !== viewerId) {
    if (card.fileName !== "" && targets.includes("tableau")) return true;
    if (card.fileName === "" && targets.includes("tableau-empty")) return true;
  }

  return false;
}

export function isCharacterTargetClickable(
  player: PlayerState,
  viewerId: number,
  targets: GameplayTarget[],
  orderedPlayers: PlayerState[],
): boolean {
  const character = getPrimaryCharacter(player);

  if (!character || character.health === 0) {
    return false;
  }

  if (targets.includes("range") && !checkPlayerDistance(orderedPlayers, viewerId, player.id, 1)) {
    return false;
  }

  if (targets.includes("wand-range") && !checkPlayerDistance(orderedPlayers, viewerId, player.id)) {
    return false;
  }

  if (player.id === viewerId && targets.includes("my-character")) return true;
  if (player.id !== viewerId && targets.includes("characters")) return true;

  return false;
}

export function isTableCardClickable(card: GameCard, targets: GameplayTarget[]): boolean {
  if (targets.includes("table") && card.fileName !== "") return true;
  if (targets.includes("table-empty") && card.fileName === "") return true;

  return false;
}

export function isDeckTargetClickable(
  targets: GameplayTarget[],
  pile: "draw" | "discard",
): boolean {
  return pile === "draw" ? targets.includes("draw") : targets.includes("discard");
}

export function canApparateBetween(
  index: number,
  players: PlayerState[],
  targets: GameplayTarget[],
) {
  if (!targets.includes("between-characters")) return false;
  if (index === 0 || index === players.length - 1) return false;

  return true;
}

export function currentRoleCardClass(state: BoardViewState): string {
  const currentPlayer = state.players.find((player) => player.id === state.playerId);
  return currentPlayer?.role?.replace(" ", "_") || "";
}
