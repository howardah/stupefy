import type { BoardViewState, PlayerState } from "../../types";
import { cardsIndexName, getPrimaryCharacter } from "../core";
import { createResolutionEvent, deathCheck } from "../events";
import {
  clearCurrentEvent,
  cloneDeckState,
  createDeathPrompt,
  restoreTurnCycleAfterDeath,
} from "./shared";

function getDyingPlayers(state: BoardViewState) {
  return state.players.filter((player) => {
    const character = getPrimaryCharacter(player);
    return Boolean(character && character.health === 0) && !state.deadPlayers.includes(player.id);
  });
}

function queueLilySavePrompts(state: BoardViewState, dyingPlayer: PlayerState) {
  const lilyPlayers = state.players.filter((player) => {
    if (state.deadPlayers.includes(player.id)) {
      return false;
    }

    return player.power.includes("lily_potter");
  });

  for (const lilyPlayer of [...lilyPlayers].reverse()) {
    state.events.unshift(
      createDeathPrompt(
        `${getPrimaryCharacter(dyingPlayer)?.shortName || dyingPlayer.name} is about to die. Would you like to give up a life point to save them?`,
        lilyPlayer,
        [
          { label: "Yes", function: "lily_yes" },
          { label: "No", function: "lily_no" },
        ],
        `${getPrimaryCharacter(lilyPlayer)?.shortName || lilyPlayer.name} has a chance to save ${getPrimaryCharacter(dyingPlayer)?.shortName || dyingPlayer.name}.`,
      ),
    );
  }

  return lilyPlayers.length > 0;
}

function applyFinalDeathConsequences(state: BoardViewState, player: PlayerState, options?: string) {
  const deck = cloneDeckState(state);
  state.deadPlayers.push(player.id);

  state.events.push(
    createResolutionEvent(
      "You are now out, but you can still influence the game! As a House Ghost, you may empower another player each turn.",
      [player.id],
      `${getPrimaryCharacter(player)?.shortName || player.name} has been defeated.`,
    ),
  );

  for (const powerPlayer of state.players) {
    if (
      powerPlayer.id !== player.id &&
      !state.deadPlayers.includes(powerPlayer.id) &&
      powerPlayer.power.includes("voldemort")
    ) {
      const character = getPrimaryCharacter(powerPlayer);
      if (character) {
        character.health += 1;
        character.maxHealth += 1;
      }
    }

    if (
      powerPlayer.id !== player.id &&
      !state.deadPlayers.includes(powerPlayer.id) &&
      powerPlayer.power.includes("lucius_malfoy")
    ) {
      powerPlayer.hand.unshift(...deck.drawCards(2));
    }
  }

  if (player.hand.length > 0) {
    if (player.power.includes("molly_weasley") && options !== "molly-skip") {
      state.events.unshift(
        createDeathPrompt(
          "You can choose a player to give your cards to or decide to pass.",
          player,
          [{ label: "skip", function: "molly" }],
          "Molly has died and is choosing who to will her cards to.",
        ),
      );
      state.deck = deck;
      return { interrupted: true };
    }

    const umbridge = state.players.find(
      (powerPlayer) =>
        powerPlayer.id !== player.id &&
        !state.deadPlayers.includes(powerPlayer.id) &&
        powerPlayer.power.includes("dolores_umbridge"),
    );

    if (umbridge) {
      umbridge.hand.unshift(...player.hand.splice(0));
    }
  }

  deck.serveCards(player.hand.splice(0));
  deck.serveCards(player.tableau.splice(0));
  state.deck = deck;
  return { interrupted: false };
}

function applyAdvancedDeaths(state: BoardViewState, options?: string) {
  const newlyDead = deathCheck(state.players, state.deadPlayers);

  if (newlyDead.length === 0) {
    return;
  }

  if (!state.turnCycle.afterDeath?.phase) {
    state.turnCycle.afterDeath = {
      action: state.turnCycle.action,
      phase: state.turnCycle.phase,
    };
  }

  for (const player of getDyingPlayers(state)) {
    state.turnCycle.phase = "death";
    state.turnCycle.action = "death";

    const deck = cloneDeckState(state);
    const butterbeerIndex = cardsIndexName(player.hand, "butterbeer");
    if (butterbeerIndex !== -1) {
      const [butterbeer] = player.hand.splice(butterbeerIndex, 1);
      if (butterbeer) {
        deck.serveCard(butterbeer);
      }
      state.deck = deck;

      const character = getPrimaryCharacter(player);
      if (character) {
        character.health += 1;
      }

      state.events.push(
        createResolutionEvent(
          "You drank a butterbeer and were spared from death.",
          [player.id],
          `${getPrimaryCharacter(player)?.shortName || player.name} drank a butterbeer and was spared from death.`,
        ),
      );
      restoreTurnCycleAfterDeath(state);
      continue;
    }

    if (player.power.includes("harry_potter")) {
      const character = getPrimaryCharacter(player) as
        | ({ end?: { deaths?: number; killer?: number } } & NonNullable<
            ReturnType<typeof getPrimaryCharacter>
          >)
        | null;

      if (character && (!character.end || character.end.deaths === 0)) {
        character.end = {
          deaths: 1,
          killer: state.turn,
        };
        character.health += 1;
        restoreTurnCycleAfterDeath(state);
        continue;
      }
    }

    if (options !== "lily-skip" && queueLilySavePrompts(state, player)) {
      state.deck = deck;
      return;
    }

    const finalDeath = applyFinalDeathConsequences(state, player, options);
    if (finalDeath.interrupted) {
      return;
    }
  }

  restoreTurnCycleAfterDeath(state);
}

function resolveDeathChoice(state: BoardViewState, action: string) {
  const event = state.events[0];

  if (action === "lily_yes") {
    const lily = state.players.find((player) => player.id === state.playerId);
    const dyingPlayer = getDyingPlayers(state)[0];

    if (!lily || !dyingPlayer) {
      return { handled: false };
    }

    const lilyCharacter = getPrimaryCharacter(lily);
    const dyingCharacter = getPrimaryCharacter(dyingPlayer);
    if (lilyCharacter && dyingCharacter) {
      dyingCharacter.health += 1;
      lilyCharacter.health -= 1;
    }

    const promptMessage = `${getPrimaryCharacter(dyingPlayer)?.shortName || dyingPlayer.name} is about to die. Would you like to give up a life point to save them?`;
    state.events = state.events.filter((currentEvent) => currentEvent.popup?.message !== promptMessage);
    state.events.unshift(
      createResolutionEvent(
        `${getPrimaryCharacter(lily)?.shortName || lily.name} sacrificed a life point to save your life!`,
        [dyingPlayer.id],
        `${getPrimaryCharacter(lily)?.shortName || lily.name} sacrificed a life point to save ${getPrimaryCharacter(dyingPlayer)?.shortName || dyingPlayer.name}'s life.`,
      ),
    );
    restoreTurnCycleAfterDeath(state);
    return { handled: true };
  }

  if (action === "lily_no") {
    const currentMessage = event?.popup?.message || "";
    clearCurrentEvent(state);

    if (currentMessage && state.events.some((currentEvent) => currentEvent.popup?.message === currentMessage)) {
      return { handled: true };
    }

    applyAdvancedDeaths(state, "lily-skip");
    return { handled: true };
  }

  if (action === "molly") {
    const molly = state.players.find((player) => player.id === state.playerId);
    const deck = cloneDeckState(state);

    if (molly) {
      deck.serveCards(molly.hand.splice(0));
    }
    state.deck = deck;
    clearCurrentEvent(state);
    applyAdvancedDeaths(state, "molly-skip");
    restoreTurnCycleAfterDeath(state);
    return { handled: true };
  }

  return { handled: false };
}

export {
  applyAdvancedDeaths,
  getDyingPlayers,
  queueLilySavePrompts,
  resolveDeathChoice,
};
