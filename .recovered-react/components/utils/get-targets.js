import { cardTargets } from "./card-targets";

const getTargets = (that) => {
  const turnCycle = that.state.turnCycle,
    targets = [];

  if (that.state.turn === that.state.player_id) {
    if (
      turnCycle.phase === "initial" ||
      turnCycle.phase === "stuck-in-azkaban"
    ) {
      targets.push(...["my-hand", "my-tableau"]);
      if (turnCycle.draw > 0) targets.push("draw");
      return targets;
    }

    if (turnCycle.phase === "selected") {
      targets.push(...["my-hand", "discard"]);

      targets.push(...cardTargets(turnCycle.action, turnCycle));

      return targets;
    }

    if (turnCycle.phase === "felix") {
      targets.push("characters");
      return targets;
    }

    if (turnCycle.phase === "selected-stuck-in-azkaban") {
      targets.push(...["my-hand", "discard"]);
      return targets;
    }

    if (turnCycle.phase === "selected-tableau") {
      targets.push(...["my-tableau", "discard"]);
      return targets;
    }

    if (turnCycle.action === "ressurection_stone") {
      if (turnCycle.phase === "ressurection_stone") {
        targets.push(...["my-tableau", "discard", "characters"]);
        /* if (turnCycle.draw === 2) */ targets.push("table-empty");
      }
      if (turnCycle.phase === "ressurection_stone-discards")
        targets.push("table");

      return targets;
    }
  }

  if (
    turnCycle.phase === "attack" &&
    (that.state.events[0]?.target.includes(that.state.player_id) ||
      that.state.player_id === turnCycle.hotseat)
  ) {
    targets.push("my-hand");
  }

  if (
    turnCycle.phase === "diagon_alley" &&
    that.state.events[0]?.target.includes(that.state.player_id)
  ) {
    targets.push("table");
  }

  if (
    turnCycle.phase === "azkaban" &&
    that.state.events[0]?.target.includes(that.state.player_id)
  ) {
    targets.push("draw");
  }

  //   console.log(that.state.player_id);
  //   console.log(turnCycle.hotseat);
  //   console.log(targets);

  return targets;
};

export { getTargets, cardTargets };
