import { Deck } from "../../javascripts/deck";

const contains = (tableau, items) => {
  if (tableau.some((item) => items.includes(item.name))) {
    for (let i = 0; i < tableau.length; i++) {
      if (items.includes(tableau[i].name)) return i;
    }
  }

  return -1;
};

function titleCase(str) {
  str = str.toLowerCase().split(" ");
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  }
  return str.join(" ");
}

export const resolveEvent = (that, key) => {
  let targets = [...that.state.turnOrder];
  // for (let i = 0; i < that.state.players.length; i++) {
  //   targets.push(i);
  // }
  console.log(key);
  console.log(that.events);

  switch (key) {
    case "stupefy":
      return {
        popup: {
          message: that.resolutionText || "",
          popupType: "resolution",
          options: [],
        },
        cardType: "resolution",
        target: targets,
      };
    case "diagon_alley":
      return {
        popup: {
          message: "Everyone‘s taken their card.",
          popupType: "resolution",
          options: [],
        },
        cardType: "resolution",
        target: targets,
      };
    case "garroting_gas":
      return {
        popup: {
          message: "The Garroting Gas has cleared!",
          popupType: "resolution",
          options: [],
        },
        cardType: "resolution",
        target: targets,
      };
    case "dementors":
      return {
        popup: {
          message: "The Dementors are gone!",
          popupType: "resolution",
          options: [],
        },
        cardType: "resolution",
        target: targets,
      };

    default:
      return false;
  }
};
