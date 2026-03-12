import { stupefy } from "./stupefy";
import { expelliarmus } from "./expelliarmus";
import { accio } from "./accio";
import { butterbeer } from "./butterbeer";
import { dementors } from "./dementors";
import { garroting_gas } from "./garroting_gas";
import { honeydukes } from "./honeydukes";
import { weasleys_wizard_weezes } from "./weasleys_wizard_weezes";
import { diagon_alley } from "./diagon_alley";
import { wizards_duel } from "./wizards_duel";
import { three_broomsticks } from "./three_broomsticks";
import { azkaban } from "./azkaban";
import { ressurection_stone } from "./ressurection_stone";
import { fiendfyre } from "./fiendfyre";
import { discardEvent } from "./discard";
import { death } from "../utils/death";
import { felix } from "./felix";

// Keep the app from crashing if the card reaction isn’t defined
let handler = {
  get: function (target, name) {
    return target.hasOwnProperty(name)
      ? target[name]
      : {
          primary: () => {
            console.log(name + " is not yet defined.");
            return false;
          },
        };
  },
};

const playCard = new Proxy(
  {
    accio,
    azkaban,
    discardEvent,
    stupefy,
    expelliarmus,
    butterbeer,
    dementors,
    honeydukes,
    diagon_alley,
    wizards_duel,
    weasleys_wizard_weezes,
    three_broomsticks,
    ressurection_stone,
    garroting_gas,
    fiendfyre,
    death,
    felix,
  },
  handler
);

export { playCard };
