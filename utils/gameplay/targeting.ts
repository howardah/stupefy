import type { BoardViewState, GameplayTarget, TurnCycle } from "../types";

export function getCardTargets(name: string, turnCycle: TurnCycle): GameplayTarget[] {
  const targets: GameplayTarget[] = [];

  switch (name) {
    case "accio":
      targets.push("tableau", "hand", "range");
      break;
    case "expelliarmus":
      targets.push("tableau", "hand");
      break;
    case "larch_wand":
    case "yew_wand":
    case "aspen_wand":
    case "holly_wand":
    case "elder_wand":
    case "broomstick":
    case "polyjuice_potion":
    case "resurrection_stone":
    case "ressurection_stone":
    case "expecto_patronum":
    case "vanishing_cabinet":
    case "invisibility_cloak":
      targets.push("my-tableau-empty", "my-character");
      break;
    case "fiendfyre":
    case "azkaban":
      targets.push("tableau-empty", "characters");
      break;
    case "felix":
      targets.push("characters");
      break;
    case "apparate":
      targets.push("between-characters");
      break;
    case "dementors":
    case "three_broomsticks":
    case "honeydukes":
    case "weasleys_wizard_weezes":
    case "garroting_gas":
    case "diagon_alley":
      targets.push("table-empty");
      break;
    case "wizards_duel":
    case "three":
      targets.push("characters");
      break;
    case "stupefy":
    case "fenrir_stupefy":
      if (turnCycle.shots > 0) targets.push("characters", "wand-range");
      break;
    case "dobby_stupefy":
    case "dobby_punish_stupefy":
      if (turnCycle.shots > 0) targets.push("characters");
      break;
    case "peeves_draw":
      targets.push("hand");
      break;
    case "peter_pettigrew":
      targets.push("tableau");
      break;
    case "tonks_copy":
    case "molly_protego":
      targets.push("characters");
      break;
    case "butterbeer":
      targets.push("my-character");
      break;
    default:
      break;
  }

  return targets;
}

export function getAvailableTargets(state: Pick<
  BoardViewState,
  "events" | "playerId" | "turn" | "turnCycle"
>): GameplayTarget[] {
  const turnCycle = state.turnCycle;
  const targets: GameplayTarget[] = [];

  if (state.turn === state.playerId) {
    if (turnCycle.phase === "initial" || turnCycle.phase === "stuck-in-azkaban") {
      targets.push("my-hand", "my-tableau");
      if (turnCycle.draw > 0) targets.push("draw");
      return targets;
    }

    if (turnCycle.phase === "selected") {
      targets.push("my-hand", "discard", ...getCardTargets(turnCycle.action, turnCycle));
      return targets;
    }

    if (turnCycle.phase === "start-turn") {
      targets.push(...getCardTargets(turnCycle.action, turnCycle));
      return targets;
    }

    if (turnCycle.phase === "felix") {
      targets.push("characters");
      return targets;
    }

    if (turnCycle.phase === "selected-stuck-in-azkaban") {
      targets.push("my-hand", "discard");
      return targets;
    }

    if (turnCycle.phase === "fred-george-discard") {
      targets.push("my-hand", "discard");
      return targets;
    }

    if (turnCycle.phase === "selected-tableau") {
      targets.push("my-tableau", "discard");
      return targets;
    }

    if (
      turnCycle.action === "ressurection_stone" ||
      turnCycle.action === "resurrection_stone"
    ) {
      if (
        turnCycle.phase === "ressurection_stone" ||
        turnCycle.phase === "resurrection_stone"
      ) {
        targets.push("my-tableau", "discard", "characters", "table-empty");
      }

      if (turnCycle.phase === "ressurection_stone-discards") {
        targets.push("table");
      }

      return targets;
    }
  }

  if (
    turnCycle.phase === "attack" &&
    (state.events[0]?.target.includes(state.playerId) || state.playerId === turnCycle.hotseat)
  ) {
    targets.push("my-hand");
  }

  if (
    turnCycle.phase === "diagon_alley" &&
    state.events[0]?.target.includes(state.playerId)
  ) {
    targets.push("table");
  }

  if (turnCycle.phase === "azkaban" && state.events[0]?.target.includes(state.playerId)) {
    targets.push("draw");
  }

  return targets;
}
