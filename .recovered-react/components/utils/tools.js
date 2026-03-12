function titleCase(str) {
  str = str.toLowerCase().split(" ");
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  }
  return str.join(" ");
}

function cardsInclude(cards, findCard) {
  return cards.some((card) => card.id === findCard.id);
}

function cardsIncludeName(cards, name) {
  return cards.some((card) => card.name === name);
}

function cardIndex(cards, findCard) {
  if (findCard.length !== undefined) {
    return cards.findIndex((card) => findCard.some((fc) => card.id === fc.id));
  }
  return cards.findIndex((card) => card.id === findCard.id);
}

function cardsIndexName(cards, name) {
  return cards.findIndex((card) => card.name === name);
}

function playerIndex(players, id) {
  return players.findIndex((player) => player.id === id);
}

export const eventIndex = (events, message) => {
  return events.findIndex((event) => event.popup.message.includes(message));
};

const popUp = (data, that) => {
  let actions = false;
  if (data.events && data.events[0]) {
    if (
      data.events[0].target.includes(that.state.player_id) &&
      data.events[0].popup
    ) {
      actions = data.events[0].popup;
    } else if (data.events[0]["bystanders-" + that.state.player_id]) {
      actions = data.events[0]["bystanders-" + that.state.player_id];
    } else if (data.events[0].bystanders) {
      actions = data.events[0].bystanders;
    }
  } else if (data.events !== undefined) {
    actions = { message: "", options: [] };
  }

  return actions;
};

function resolutionEvent(message, targets, bystanders) {
  let event = {
    popup: {
      message: message,
      popupType: "resolution",
      options: [],
    },
    cardType: "resolution",
    target: targets,
  };

  if (bystanders)
    event.bystanders = {
      message: bystanders,
      popupType: "resolution",
      options: [],
    };

  return event;
}

function deathEvent(message, target, options, bystanders) {
  let event = {
    popup: {
      message: message,
      popupType: "subtle",
      options: options,
    },
    cardType: target.character.fileName,
    target: [target.id],
  };

  if (bystanders)
    event.bystanders = {
      message: bystanders,
      popupType: "subtle",
      options: [],
    };

  return event;
}

function deathCheck(players, deadPlayers) {
  const newlyDead = [];
  players.forEach((player) => {
    // If the player is dead, but not yet registered as dead i.e. "newly dead"
    if (player.character.health === 0 && !deadPlayers.includes(player.id)) {
      newlyDead.push(player.id);
    }
  });
  return newlyDead;
}

const tableauProblems = (tableau) => {
  const wands = [
    "larch_wand",
    "yew_wand",
    "aspen_wand",
    "holly_wand",
    "elder_wand",
  ];
  let cardnames = [],
    wandCount = 0,
    alert = false;

  for (let i = 0; i < tableau.length; i++) {
    if (wands.includes(tableau[i].name)) wandCount++;
    if (wandCount > 1)
      return "You can only have one wand! Discard your current wand first.";
    if (cardnames.includes(tableau[i].name)) {
      if (tableau[i].name === "azkaban") return "They are already in Azkaban!";
      return (
        "You can only have one " +
        titleCase(tableau[i].name.replace("_", " ")) +
        " Discard your current one first."
      );
    }
    cardnames.push(tableau[i].name);
  }

  tableau.forEach((card) => {});

  return alert;
};

export {
  titleCase,
  cardsInclude,
  cardIndex,
  cardsIncludeName,
  cardsIndexName,
  playerIndex,
  popUp,
  resolutionEvent,
  deathEvent,
  deathCheck,
  tableauProblems,
};
