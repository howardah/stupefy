export const cardTargets = (name, turnCycle) => {
  const targets = [];

  switch (name) {
    case "accio":
      targets.push(...["tableau", "hand", "range"]);
      break;
    case "expelliarmus":
      targets.push(...["tableau", "hand"]);
      break;
    case "larch_wand":
    case "yew_wand":
    case "aspen_wand":
    case "holly_wand":
    case "elder_wand":
    case "broomstick":
    case "polyjuice_potion":
    case "resurrection_stone":
    case "expecto_patronum":
    case "vanishing_cabinet":
    case "invisibility_cloak":
      targets.push(...["my-tableau-empty", "my-character"]);
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
      targets.push("characters");
      break;
    case "stupefy":
      if (turnCycle.shots > 0) targets.push("characters", "wand-range");
      break;
    case "butterbeer":
      targets.push("my-character");
      break;
    case "three":
      targets.push("characters");
      break;
    default:
      break;
  }

  return targets;
};
