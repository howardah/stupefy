import type {
  BoardAlert,
  BoardViewState,
  GameCard,
  GameEvent,
  PlayerState,
  PopupOption,
  TurnCyclePlayerState,
} from "../types";
import Deck from "../deck";
import {
  cardIndex,
  cardsInclude,
  cardsIncludeName,
  cardsIndexName,
  getPrimaryCharacter,
  playerIndex,
  titleCase,
} from "./core";
import {
  createResolutionEvent,
  deathCheck,
  protegoOptions,
  tableauProblems,
} from "./events";
import {
  cycleCleanse,
  incrementTurn,
} from "./turn-cycle";

type AlertTone = NonNullable<BoardAlert["tone"]>;
type PushAlert = (message: string, tone?: AlertTone) => void;

interface RuleResult {
  handled: boolean;
}

function cloneDeckState(state: BoardViewState) {
  return new Deck<GameCard>([...state.deck.cards], [...state.deck.discards]);
}

function viewerPlayer(state: BoardViewState) {
  const index = playerIndex(state.players, state.playerId);
  return index === -1 ? null : state.players[index]!;
}

function activePlayer(state: BoardViewState) {
  const index = playerIndex(state.players, state.turn);
  return index === -1 ? null : state.players[index]!;
}

function getPlayerById(state: BoardViewState, playerId: number) {
  return state.players.find((player) => player.id === playerId) ?? null;
}

function getCurrentEvent(state: BoardViewState) {
  return state.events[0] ?? null;
}

function ensureReactionState(state: BoardViewState, playerId: number): TurnCyclePlayerState {
  const key = `id${playerId}`;
  const currentValue = state.turnCycle[key];

  if (!currentValue || typeof currentValue !== "object" || !("cards" in currentValue)) {
    state.turnCycle[key] = { cards: [] };
  }

  return state.turnCycle[key] as TurnCyclePlayerState;
}

function discardCards(player: PlayerState, deck: Deck<GameCard>, cards: GameCard[]) {
  for (const selectedCard of cards) {
    let location: "hand" | "tableau" = "hand";
    let currentIndex = cardIndex(player.hand, selectedCard);

    if (currentIndex === -1) {
      location = "tableau";
      currentIndex = cardIndex(player.tableau, selectedCard);
    }

    if (currentIndex === -1) {
      continue;
    }

    const [discardedCard] = player[location].splice(currentIndex, 1);
    if (discardedCard) {
      deck.serveCard(discardedCard);
    }
  }
}

function discardSelected(state: BoardViewState) {
  const deck = cloneDeckState(state);
  const player = activePlayer(state);

  if (!player) {
    return null;
  }

  discardCards(player, deck, state.turnCycle.cards);
  return { deck, player };
}

function createBystanderPopup(
  message: string,
  popupType: "resolution" | "subtle" = "resolution"
) {
  return {
    message,
    options: [] as PopupOption[],
    popupType,
  };
}

function isProtegoCard(player: PlayerState, cardName: string) {
  const character = getPrimaryCharacter(player)?.fileName;

  switch (character) {
    case "luna_lovegood":
      return true;
    case "ginny_weasley":
      return cardName === "stupefy" || cardName === "protego";
    default:
      return cardName === "protego";
  }
}

function isStupefyCard(player: PlayerState, cards: GameCard[]) {
  const character = getPrimaryCharacter(player)?.fileName;

  if (cards.length !== 1) {
    return false;
  }

  if (character === "ginny_weasley") {
    return cards[0]?.name === "stupefy" || cards[0]?.name === "protego";
  }

  return cards[0]?.name === "stupefy";
}

function summarizeDamagedPlayers(state: BoardViewState, prefix: string) {
  const damaged = state.players
    .filter((player) => ensureReactionState(state, player.id).choice === "takeHit")
    .map((player) => getPrimaryCharacter(player)?.shortName || player.name);

  if (damaged.length === 0) {
    return prefix;
  }

  if (damaged.length === 1) {
    return `${prefix} ${damaged[0]} took damage.`;
  }

  if (damaged.length === 2) {
    return `${prefix} ${damaged[0]} and ${damaged[1]} both took damage.`;
  }

  return `${prefix} ${damaged.slice(0, -1).join(", ")}, and ${damaged.at(-1)} all took damage.`;
}

function clearCurrentEvent(state: BoardViewState) {
  state.events.shift();
}

function finishEventForPlayer(
  state: BoardViewState,
  resolutionEvent: GameEvent | null,
  multiTargetPrefix?: string
) {
  const event = getCurrentEvent(state);

  if (!event) {
    return;
  }

  if (event.target.length > 1) {
    event.target = event.target.filter((target) => target !== state.playerId);

    if (event.target.length > 0) {
      return;
    }

    clearCurrentEvent(state);

    if (multiTargetPrefix) {
      state.events.unshift(
        createResolutionEvent(
          summarizeDamagedPlayers(state, multiTargetPrefix),
          [state.playerId],
          summarizeDamagedPlayers(state, multiTargetPrefix)
        )
      );
    }
  } else {
    clearCurrentEvent(state);

    if (resolutionEvent) {
      state.events.unshift(resolutionEvent);
    }
  }

  state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
}

function applySimpleDeaths(state: BoardViewState) {
  const newlyDead = deathCheck(state.players, state.deadPlayers);

  if (newlyDead.length === 0) {
    return;
  }

  const deck = cloneDeckState(state);

  for (const playerId of newlyDead) {
    const player = getPlayerById(state, playerId);
    if (!player) {
      continue;
    }

    const butterbeerIndex = cardsIndexName(player.hand, "butterbeer");
    if (butterbeerIndex !== -1) {
      const [butterbeer] = player.hand.splice(butterbeerIndex, 1);
      if (butterbeer) {
        deck.serveCard(butterbeer);
      }

      const character = getPrimaryCharacter(player);
      if (character) {
        character.health += 1;
      }

      state.events.push(
        createResolutionEvent(
          "You drank a butterbeer and were spared from death.",
          [player.id],
          `${getPrimaryCharacter(player)?.shortName || player.name} drank a butterbeer and was spared from death.`
        )
      );
      continue;
    }

    state.deadPlayers.push(player.id);
    deck.serveCards(player.hand.splice(0));
    deck.serveCards(player.tableau.splice(0));
    state.events.push(
      createResolutionEvent(
        "You are now out, but you can still influence the game as a House Ghost.",
        [player.id],
        `${getPrimaryCharacter(player)?.shortName || player.name} has been defeated.`
      )
    );
  }

  state.deck = deck;
}

function checkTopCardForHouses(state: BoardViewState, houses: string[]) {
  const deck = cloneDeckState(state);
  const drawnCard = deck.drawCards(1)[0];

  if (!drawnCard) {
    return {
      deck,
      gotIt: false,
      house: "Unknown",
    };
  }

  deck.serveCard(drawnCard);

  const houseLabels: Record<string, string> = {
    G: "Griffindor",
    H: "Hufflepuff",
    R: "Ravenclaw",
    S: "Slytherine",
  };

  return {
    deck,
    gotIt: houses.includes(drawnCard.house || ""),
    house: houseLabels[drawnCard.house || ""] || "Unknown",
  };
}

function determineHouse(player: PlayerState, state: BoardViewState) {
  const directHouse = getPrimaryCharacter(player)?.house;
  if (directHouse) {
    return directHouse;
  }

  let previousTurnIndex = state.turnOrder.indexOf(state.playerId) - 1;
  if (previousTurnIndex < 0) {
    previousTurnIndex += state.turnOrder.length;
  }

  const previousPlayer = getPlayerById(state, state.turnOrder[previousTurnIndex] ?? state.playerId);
  const previousHouse = previousPlayer ? getPrimaryCharacter(previousPlayer)?.house : "";

  return previousHouse || "H";
}

function resolveProtectionChoice(
  state: BoardViewState,
  action: string,
  actionIndex: number,
  pushAlert: PushAlert
) {
  const player = viewerPlayer(state);
  const event = getCurrentEvent(state);

  if (!player || !event) {
    return false;
  }

  const reaction = ensureReactionState(state, state.playerId);
  reaction.choice = action;

  switch (action) {
    case "takeHit": {
      const character = getPrimaryCharacter(player);
      if (character) {
        character.health -= 1;
      }
      return true;
    }
    case "playProtego": {
      if (reaction.cards.length === 0) {
        pushAlert("Choose a Protego card first.", "info");
        return false;
      }

      if (!reaction.cards.every((card) => isProtegoCard(player, card.name))) {
        pushAlert("You must choose cards that work as Protego charms.", "warning");
        return false;
      }

      const deck = cloneDeckState(state);
      discardCards(player, deck, reaction.cards);
      state.deck = deck;
      reaction.cards = [];
      return true;
    }
    case "playStupefy": {
      if (!isStupefyCard(player, reaction.cards)) {
        pushAlert("You must choose exactly one Stupefy card.", "warning");
        return false;
      }

      const deck = cloneDeckState(state);
      discardCards(player, deck, reaction.cards);
      state.deck = deck;
      reaction.cards = [];
      return true;
    }
    case "houseHide":
    case "invisibilityHide": {
      const allowedHouses =
        action === "invisibilityHide"
          ? ["H", "S", "G", "R"].filter((house) => house !== determineHouse(player, state))
          : [determineHouse(player, state)];
      const result = checkTopCardForHouses(state, allowedHouses);

      state.deck = result.deck;

      if (result.gotIt) {
        pushAlert(`Hooray! You drew a ${result.house}, and the spell missed.`, "info");
        return true;
      }

      const options = event.popup?.options ?? [];
      options.splice(actionIndex, 1);
      pushAlert(`Bummer! You drew a ${result.house}.`, "warning");
      return false;
    }
    case "clearEvent":
      return true;
    default:
      return false;
  }
}

function resolveStupefyResolution(state: BoardViewState, lastAction: string) {
  const instigator = activePlayer(state);
  const subject = getPlayerById(state, state.turnCycle.hotseat);

  if (!instigator || !subject) {
    return null;
  }

  const instigatorName = getPrimaryCharacter(instigator)?.shortName || instigator.name;
  const subjectName = getPrimaryCharacter(subject)?.shortName || subject.name;

  switch (lastAction) {
    case "houseHide":
      return createResolutionEvent(
        "You have successfully hidden and the spell missed.",
        [subject.id],
        `${subjectName} hid in a vanishing cabinet and ${instigatorName}'s Stupefy missed.`
      );
    case "takeHit":
      return createResolutionEvent(
        "You have taken a hit!",
        [subject.id],
        `${subjectName} was hit by ${instigatorName}'s Stupefy.`
      );
    case "playProtego":
      return createResolutionEvent(
        "You have successfully cast Protego.",
        [subject.id],
        `${subjectName} used Protego and blocked ${instigatorName}'s Stupefy.`
      );
    case "invisibilityHide":
      return createResolutionEvent(
        "You have successfully hidden and the spell missed.",
        [subject.id],
        `${subjectName} hid in an invisibility cloak and ${instigatorName}'s Stupefy missed.`
      );
    case "clearEvent":
      return createResolutionEvent(
        "The spell missed.",
        [subject.id],
        `${subjectName} is untouchable and ${instigatorName}'s Stupefy missed.`
      );
    default:
      return null;
  }
}

function startStupefy(state: BoardViewState, subject: PlayerState) {
  const discarded = discardSelected(state);
  const instigator = activePlayer(state);

  if (!discarded || !instigator) {
    return false;
  }

  state.players = state.players;
  state.deck = discarded.deck;
  state.turnCycle.shots -= 1;
  state.turnCycle.hotseat = subject.id;
  state.turnCycle.phase = "attack";

  const options = protegoOptions(subject, [
    { label: "Take a hit", function: "takeHit" },
    { label: "Play Protego", function: "playProtego" },
  ]);

  state.events = [
    {
      popup: {
        message: `${getPrimaryCharacter(instigator)?.shortName || instigator.name} has fired a Stupefy at you!`,
        options,
      },
      instigator,
      cardType: "stupefy",
      target: [subject.id],
      bystanders: createBystanderPopup(
        `${getPrimaryCharacter(instigator)?.shortName || instigator.name} has fired a Stupefy at ${getPrimaryCharacter(subject)?.shortName || subject.name}!`,
        "subtle"
      ),
      [`bystanders-${instigator.id}`]: createBystanderPopup(
        `You have fired a Stupefy at ${getPrimaryCharacter(subject)?.shortName || subject.name}!`,
        "subtle"
      ),
    },
  ];

  return true;
}

function startFelixSelection(state: BoardViewState, subject: PlayerState, pushAlert: PushAlert) {
  const currentIndex = state.turnCycle.felix.findIndex((entry) => entry.id === subject.id);

  state.turnCycle.phase = "felix";

  if (currentIndex !== -1) {
    state.turnCycle.felix.splice(currentIndex, 1);
  } else if (state.turnCycle.felix.length < 2) {
    state.turnCycle.felix.push(subject);
  } else {
    pushAlert(
      "You can only target a maximum of two players with Felix Felicis. Deselect another player first.",
      "warning"
    );
    return false;
  }

  if (!state.events.some((event) => event.cardType === "felix_felicis")) {
    state.events.push({
      popup: {
        message: "Choose one player to cast two spells at or two players to shoot once each.",
        options: [
          { label: "Stupefy!", function: "shoot" },
          { label: "X", function: "cancel" },
        ],
        popupType: "subtle",
      },
      instigator: activePlayer(state) ?? undefined,
      cardType: "felix_felicis",
      target: [state.playerId],
    });
  }

  return true;
}

function startWizardsDuel(state: BoardViewState, subject: PlayerState) {
  const discarded = discardSelected(state);
  const instigator = activePlayer(state);

  if (!discarded || !instigator) {
    return false;
  }

  state.deck = discarded.deck;
  state.turnCycle.hotseat = subject.id;
  state.turnCycle.phase = "attack";
  state.events = [
    {
      popup: {
        message: `${getPrimaryCharacter(instigator)?.shortName || instigator.name} has challenged you to a Wizard's Duel!`,
        options: [
          { label: "Take a hit", function: "takeHit" },
          { label: "Play Stupefy", function: "duel" },
        ],
      },
      [`bystanders-${instigator.id}`]: createBystanderPopup(
        `You have challenged ${getPrimaryCharacter(subject)?.shortName || subject.name} to a Wizard's Duel!`,
        "subtle"
      ),
      bystanders: createBystanderPopup(
        `${getPrimaryCharacter(instigator)?.shortName || instigator.name} has challenged ${getPrimaryCharacter(subject)?.shortName || subject.name} to a Wizard's Duel!`,
        "subtle"
      ),
      instigator,
      cardType: "wizards_duel",
      target: [subject.id],
    },
  ];

  return true;
}

function startFiendfyre(state: BoardViewState, subjectPlayerId: number) {
  const subject = getPlayerById(state, subjectPlayerId);
  const instigator = viewerPlayer(state);
  const selectedCard = state.turnCycle.cards[0];

  if (!subject || !instigator || !selectedCard) {
    return false;
  }

  const selectedIndex = instigator.hand.findIndex((card) => card.id === selectedCard.id);
  if (selectedIndex === -1) {
    return false;
  }

  const [fiendfyreCard] = instigator.hand.splice(selectedIndex, 1);
  if (!fiendfyreCard) {
    return false;
  }

  subject.tableau.push(fiendfyreCard);
  state.turnCycle.phase = "attack";
  state.turnCycle.action = "fiendfyre";
  state.turnCycle.hotseat = subject.id;
  state.events.push({
    popup: {
      message: `${getPrimaryCharacter(instigator)?.shortName || instigator.name} has cast Fiendfyre at you! Draw a card to see if you make it past.`,
      options: [{ label: "Draw Card", function: "draw" }],
      popupType: "subtle",
    },
    bystanders: createBystanderPopup(
      `${getPrimaryCharacter(instigator)?.shortName || instigator.name} has cast Fiendfyre at ${getPrimaryCharacter(subject)?.shortName || subject.name}! They must draw to try to get past.`,
      "subtle"
    ),
    instigator,
    cardType: "fiendfyre",
    target: [subject.id],
  });

  return true;
}

function resolveAccio(
  state: BoardViewState,
  subject: PlayerState,
  card: GameCard
) {
  const discarded = discardSelected(state);
  const instigator = viewerPlayer(state);

  if (!discarded || !instigator) {
    return false;
  }

  const hand = cardsInclude(subject.hand, card);
  const source = hand ? subject.hand : subject.tableau;
  const sourceIndex = cardIndex(source, card);

  if (sourceIndex === -1) {
    return false;
  }

  const [stolenCard] = source.splice(sourceIndex, 1);
  if (!stolenCard) {
    return false;
  }

  instigator.hand.unshift(stolenCard);
  state.deck = discarded.deck;
  state.events.push(
    createResolutionEvent(
      `${getPrimaryCharacter(instigator)?.shortName || instigator.name} used a summoning charm to steal your ${titleCase(card.name.replaceAll("_", " "))}.`,
      [subject.id],
      `${getPrimaryCharacter(instigator)?.shortName || instigator.name} used a summoning charm to steal ${hand ? "from " : ""}${getPrimaryCharacter(subject)?.shortName || subject.name}'s ${hand ? "hand." : `${titleCase(card.name.replaceAll("_", " "))}.`}`
    )
  );
  state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
  return true;
}

function resolveExpelliarmus(
  state: BoardViewState,
  subject: PlayerState,
  card: GameCard
) {
  const instigator = viewerPlayer(state);

  if (!instigator) {
    return false;
  }

  const deck = cloneDeckState(state);
  const hand = cardsInclude(subject.hand, card);
  const source = hand ? subject.hand : subject.tableau;
  const sourceIndex = cardIndex(source, card);
  const selectedCard = state.turnCycle.cards[0];

  if (sourceIndex === -1 || !selectedCard) {
    return false;
  }

  const [discardedTarget] = source.splice(sourceIndex, 1);
  const selectedIndex = cardIndex(instigator.hand, selectedCard);
  const [discardedSelf] = selectedIndex === -1 ? [] : instigator.hand.splice(selectedIndex, 1);

  if (discardedTarget) {
    deck.serveCard(discardedTarget);
  }

  if (discardedSelf) {
    deck.serveCard(discardedSelf);
  }

  state.deck = deck;
  state.events.push(
    createResolutionEvent(
      `${getPrimaryCharacter(instigator)?.shortName || instigator.name} discarded your ${titleCase(card.name.replaceAll("_", " "))}.`,
      [subject.id],
      `${getPrimaryCharacter(instigator)?.shortName || instigator.name} discarded ${getPrimaryCharacter(subject)?.shortName || subject.name}'s ${titleCase(card.name.replaceAll("_", " "))}.`
    )
  );
  state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
  return true;
}

function startMassEvent(state: BoardViewState, cardType: "dementors" | "garroting_gas") {
  const discarded = discardSelected(state);
  const instigator = activePlayer(state);

  if (!discarded || !instigator) {
    return false;
  }

  const targets = state.players
    .filter((player) => !state.deadPlayers.includes(player.id))
    .filter((player) =>
      cardType === "dementors"
        ? player.id !== instigator.id && !cardsIncludeName(player.tableau, "expecto_patronum")
        : true
    )
    .map((player) => player.id);

  state.deck = discarded.deck;
  state.turnCycle.phase = "attack";
  state.events.push({
    popup: {
      message:
        cardType === "dementors"
          ? "Dementors attack! Play a Stupefy card to fight them off!"
          : "Garrotting Gas! Play a Protego card to protect yourself!",
      options:
        cardType === "dementors"
          ? [
              { label: "Take a hit", function: "takeHit" },
              { label: "Play a Stupefy", function: "playStupefy" },
            ]
          : [
              { label: "Take a hit", function: "takeHit" },
              { label: "Cast Protego", function: "playProtego" },
            ],
    },
    bystanders: createBystanderPopup(
      cardType === "dementors" ? "Whoosh, you're past the Dementors now!" : "Whoosh, you're safe now!",
      "subtle"
    ),
    instigator,
    cardType,
    target: targets,
  });
  return true;
}

function startSelfBuff(state: BoardViewState, drawBonus: number, message: string) {
  const discarded = discardSelected(state);
  const player = viewerPlayer(state);

  if (!discarded || !player) {
    return false;
  }

  state.deck = discarded.deck;
  state.turnCycle.draw += drawBonus;
  state.events.push(createResolutionEvent(message, [player.id], message.replace("You", getPrimaryCharacter(player)?.shortName || player.name)));
  state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
  return true;
}

function startThreeBroomsticks(state: BoardViewState) {
  const discarded = discardSelected(state);
  const bartender = activePlayer(state);

  if (!discarded || !bartender) {
    return false;
  }

  state.deck = discarded.deck;
  state.players.forEach((player) => {
    const character = getPrimaryCharacter(player);
    if (character && character.health < character.maxHealth) {
      character.health += 1;
    }
  });
  state.events.push(
    createResolutionEvent(
      "You played the Three Broomsticks and everyone has been healed for 1 point!",
      [bartender.id],
      `${getPrimaryCharacter(bartender)?.shortName || bartender.name} played the Three Broomsticks and everyone has been healed for 1 point!`
    )
  );
  state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
  return true;
}

function startDiagonAlley(state: BoardViewState) {
  const discarded = discardSelected(state);
  const instigator = activePlayer(state);

  if (!discarded || !instigator) {
    return false;
  }

  const deck = discarded.deck;
  const table = [...state.table];
  const events: GameEvent[] = [];
  const turnIndex = state.turnOrder.indexOf(state.turn);

  for (let index = 0; index < state.turnOrder.length; index += 1) {
    let currentIndex = index + turnIndex;
    if (currentIndex >= state.turnOrder.length) {
      currentIndex -= state.turnOrder.length;
    }

    const playerId = state.turnOrder[currentIndex]!;
    if (state.deadPlayers.includes(playerId)) {
      continue;
    }

    const tableCard = deck.drawCards(1)[0];
    if (tableCard) {
      table.push(tableCard);
    }

    const isCurrentPlayer = currentIndex === turnIndex;
    events.push({
      popup: createBystanderPopup(
        isCurrentPlayer
          ? "Diagon Alley! Take a card from the table!"
          : `${getPrimaryCharacter(instigator)?.shortName || instigator.name} has played Diagon Alley! Your turn to take a card!`,
        "subtle"
      ),
      bystanders: createBystanderPopup(
        isCurrentPlayer
          ? "Everyone else is choosing their cards."
          : `${getPrimaryCharacter(instigator)?.shortName || instigator.name} has played Diagon Alley!`,
        "subtle"
      ),
      instigator,
      cardType: "diagon_alley",
      target: [playerId],
    });
  }

  state.deck = deck;
  state.table = table;
  state.events = events;
  state.turnCycle.phase = "diagon_alley";
  return true;
}

export function handleRuleCharacterClick(
  state: BoardViewState,
  targetPlayerId: number,
  pushAlert: PushAlert
): RuleResult {
  const targetPlayer = getPlayerById(state, targetPlayerId);

  if (!targetPlayer) {
    return { handled: false };
  }

  switch (state.turnCycle.action) {
    case "butterbeer": {
      const discarded = discardSelected(state);

      if (!discarded) {
        return { handled: false };
      }

      const character = getPrimaryCharacter(targetPlayer);
      if (!character || character.health >= character.maxHealth) {
        pushAlert("This player is already at max health.", "info");
        return { handled: true };
      }

      character.health += 1;
      if (targetPlayer.power.includes("rubeus_hagrid") && character.health < character.maxHealth) {
        character.health += 1;
      }

      state.deck = discarded.deck;
      state.events.push(
        createResolutionEvent(
          "You drank butterbeer and were healed for 1 point!",
          [targetPlayer.id],
          `${character.shortName} drank butterbeer and was healed for 1 point!`
        )
      );
      state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
      return { handled: true };
    }
    case "stupefy":
      return { handled: startStupefy(state, targetPlayer) };
    case "wizards_duel":
      return { handled: startWizardsDuel(state, targetPlayer) };
    case "felix":
      return { handled: startFelixSelection(state, targetPlayer, pushAlert) };
    case "fiendfyre":
      return { handled: startFiendfyre(state, targetPlayer.id) };
    default:
      return { handled: false };
  }
}

export function handleRuleHandClick(
  state: BoardViewState,
  targetPlayerId: number,
  card: GameCard
): RuleResult {
  const targetPlayer = getPlayerById(state, targetPlayerId);
  if (!targetPlayer) {
    return { handled: false };
  }

  switch (state.turnCycle.action) {
    case "accio":
      return { handled: resolveAccio(state, targetPlayer, card) };
    case "expelliarmus":
      return { handled: resolveExpelliarmus(state, targetPlayer, card) };
    default:
      return { handled: false };
  }
}

export function handleRuleTableauClick(
  state: BoardViewState,
  targetPlayerId: number,
  card: GameCard
): RuleResult {
  if (card.fileName === "" && state.turnCycle.cards[0]?.name === "fiendfyre") {
    return { handled: startFiendfyre(state, targetPlayerId) };
  }

  const targetPlayer = getPlayerById(state, targetPlayerId);
  if (!targetPlayer) {
    return { handled: false };
  }

  switch (state.turnCycle.action) {
    case "accio":
      return { handled: resolveAccio(state, targetPlayer, card) };
    case "expelliarmus":
      return { handled: resolveExpelliarmus(state, targetPlayer, card) };
    default:
      return { handled: false };
  }
}

export function handleRuleTableClick(
  state: BoardViewState,
  card: GameCard,
  pushAlert: PushAlert
): RuleResult {
  if (
    (state.turnCycle.phase === "ressurection_stone" ||
      state.turnCycle.phase === "resurrection_stone") &&
    card.fileName === ""
  ) {
    state.table = [...state.deck.discards];
    state.deck = {
      ...state.deck,
      discards: [],
    };
    state.turnCycle.phase = "ressurection_stone-discards";
    return { handled: true };
  }

  if (state.turnCycle.phase === "ressurection_stone-discards") {
    const player = viewerPlayer(state);
    if (!player) {
      return { handled: false };
    }

    const tableIndex = cardIndex(state.table, card);
    if (tableIndex === -1) {
      return { handled: false };
    }

    const [resurrectedCard] = state.table.splice(tableIndex, 1);
    if (resurrectedCard) {
      player.hand.unshift(resurrectedCard);
    }

    const deck = cloneDeckState(state);
    deck.serveCards(state.table.splice(0));
    state.deck = deck;
    state.events.push(
      createResolutionEvent(
        `You took a ${titleCase(card.name.replaceAll("_", " "))} from the discard.`,
        [player.id],
        `${getPrimaryCharacter(player)?.shortName || player.name} resurrected a card from the discard with the Resurrection Stone.`
      )
    );
    state.turnCycle.used.push("ressurection_stone");
    state.turnCycle.draw = Math.max(0, state.turnCycle.draw - 1);
    state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
    return { handled: true };
  }

  if (state.turnCycle.phase === "diagon_alley") {
    const player = viewerPlayer(state);
    if (!player) {
      return { handled: false };
    }

    const tableIndex = cardIndex(state.table, card);
    if (tableIndex === -1) {
      return { handled: false };
    }

    const [drawnCard] = state.table.splice(tableIndex, 1);
    if (drawnCard) {
      player.hand.unshift(drawnCard);
    }

    clearCurrentEvent(state);
    if (state.events.length === 0) {
      state.events.unshift(
        createResolutionEvent(
          "All players have taken their cards from Diagon Alley!",
          [player.id],
          "All players have taken their cards from Diagon Alley!"
        )
      );
      state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
    }

    return { handled: true };
  }

  if (card.fileName !== "") {
    return { handled: false };
  }

  switch (state.turnCycle.action) {
    case "dementors":
      return { handled: startMassEvent(state, "dementors") };
    case "garroting_gas":
      return { handled: startMassEvent(state, "garroting_gas") };
    case "diagon_alley":
      return { handled: startDiagonAlley(state) };
    case "honeydukes":
      return {
        handled: startSelfBuff(
          state,
          2,
          "You have played Honeydukes and get to draw two more cards."
        ),
      };
    case "weasleys_wizard_weezes":
      return {
        handled: startSelfBuff(
          state,
          3,
          "You have played Weasleys' Wizard Weezes and get to draw three more cards."
        ),
      };
    case "three_broomsticks":
      return { handled: startThreeBroomsticks(state) };
    default:
      pushAlert("This table interaction is still pending a later rule port.", "info");
      return { handled: true };
  }
}

export function handleRulePopupChoice(
  state: BoardViewState,
  action: string,
  actionIndex: number,
  pushAlert: PushAlert
): RuleResult {
  const event = getCurrentEvent(state);
  const player = viewerPlayer(state);

  if (!event || !player) {
    return { handled: false };
  }

  const reaction = ensureReactionState(state, state.playerId);
  reaction.choice = action;

  switch (state.turnCycle.action) {
    case "discardEvent": {
      if (action === "dump") {
        const deck = cloneDeckState(state);
        discardCards(player, deck, state.turnCycle.cards);
        state.deck = deck;
        clearCurrentEvent(state);
        state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
        return { handled: true };
      }

      if (action === "clear") {
        clearCurrentEvent(state);
        state.turnCycle.phase = "selected";
        if (state.turnCycle.cards.length === 1) {
          state.turnCycle.action = state.turnCycle.cards[0]!.name;
        } else if (
          state.turnCycle.cards.length === 2 &&
          state.turnCycle.cards.some((card) => card.name === "stupefy") &&
          state.turnCycle.cards.some((card) => card.name === "felix_felicis")
        ) {
          state.turnCycle.action = "felix";
        } else {
          state.turnCycle.action = "discard";
        }
        return { handled: true };
      }

      return { handled: false };
    }
    case "stupefy": {
      const resolved = resolveProtectionChoice(state, action, actionIndex, pushAlert);
      if (!resolved) {
        return { handled: action === "takeHit" };
      }

      applySimpleDeaths(state);
      finishEventForPlayer(state, resolveStupefyResolution(state, action));
      return { handled: true };
    }
    case "garroting_gas":
    case "dementors": {
      const resolved = resolveProtectionChoice(state, action, actionIndex, pushAlert);
      if (!resolved) {
        return { handled: action === "takeHit" };
      }

      applySimpleDeaths(state);
      finishEventForPlayer(
        state,
        null,
        state.turnCycle.action === "garroting_gas" ? "The gas is cleared." : "The Dementors have passed."
      );
      return { handled: true };
    }
    case "wizards_duel": {
      if (action === "takeHit") {
        const character = getPrimaryCharacter(player);
        if (character) {
          character.health -= 1;
        }
        applySimpleDeaths(state);
        const instigator = event.instigator ? getPlayerById(state, event.instigator.id) : null;
        const loser = getPlayerById(state, event.target[0] as number);
        clearCurrentEvent(state);
        if (instigator && loser) {
          state.events.unshift(
            createResolutionEvent(
              `You beat ${getPrimaryCharacter(loser)?.shortName || loser.name} in a Wizard's Duel.`,
              [instigator.id],
              `${getPrimaryCharacter(instigator)?.shortName || instigator.name} beat ${getPrimaryCharacter(loser)?.shortName || loser.name} in a Wizard's Duel.`
            )
          );
        }
        state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
        return { handled: true };
      }

      if (action === "duel") {
        if (!isStupefyCard(player, reaction.cards)) {
          pushAlert("You must choose exactly one Stupefy card.", "warning");
          return { handled: true };
        }

        const deck = cloneDeckState(state);
        discardCards(player, deck, reaction.cards);
        state.deck = deck;
        reaction.cards = [];

        const defender = event.instigator ? getPlayerById(state, event.instigator.id) : null;
        if (!defender) {
          return { handled: false };
        }

        clearCurrentEvent(state);
        state.events.push({
          popup: {
            message: `${getPrimaryCharacter(player)?.shortName || player.name} has cast a Stupefy back at you!`,
            options: [
              { label: "Take a hit", function: "takeHit" },
              { label: "Play Stupefy", function: "duel" },
            ],
          },
          [`bystanders-${player.id}`]: createBystanderPopup(
            `You've cast a Stupefy at ${getPrimaryCharacter(defender)?.shortName || defender.name}!`,
            "subtle"
          ),
          bystanders: createBystanderPopup(
            `${getPrimaryCharacter(player)?.shortName || player.name} and ${getPrimaryCharacter(defender)?.shortName || defender.name} are fighting a Wizard's Duel!`,
            "subtle"
          ),
          instigator: player,
          cardType: "wizards_duel",
          target: [defender.id],
        });
        return { handled: true };
      }

      return { handled: false };
    }
    case "felix": {
      const instigator = activePlayer(state);
      if (!instigator) {
        return { handled: false };
      }

      if (action === "cancel") {
        clearCurrentEvent(state);
        state.turnCycle.phase = "selected";
        state.turnCycle.felix = [];
        return { handled: true };
      }

      if (action === "shoot") {
        if (state.turnCycle.felix.length === 0) {
          pushAlert("Choose at least one player before using Felix Felicis.", "warning");
          return { handled: true };
        }

        const deck = cloneDeckState(state);
        const targets =
          state.turnCycle.felix.length === 2
            ? [state.turnCycle.felix[0], state.turnCycle.felix[1]]
            : [state.turnCycle.felix[0], state.turnCycle.felix[0]];

        for (const target of targets) {
          const character = target ? getPrimaryCharacter(target) : null;
          if (character) {
            character.health -= 1;
          }
        }

        for (const selectedCard of state.turnCycle.cards) {
          const handIndex = cardIndex(instigator.hand, selectedCard);
          if (handIndex === -1) {
            continue;
          }

          const [discardedCard] = instigator.hand.splice(handIndex, 1);
          if (discardedCard && discardedCard.name !== "felix_felicis") {
            deck.serveCard(discardedCard);
          }
        }

        clearCurrentEvent(state);
        applySimpleDeaths(state);
        state.deck = deck;
        state.events.unshift(
          createResolutionEvent(
            state.turnCycle.felix.length === 2
              ? `${getPrimaryCharacter(state.turnCycle.felix[0]!)?.shortName || ""} and ${getPrimaryCharacter(state.turnCycle.felix[1]!)?.shortName || ""} were both shot by Felix-fortified Stupefy.`
              : `${getPrimaryCharacter(state.turnCycle.felix[0]!)?.shortName || ""} was shot by Felix-fortified Stupefy.`,
            [instigator.id],
            state.turnCycle.felix.length === 2
              ? `${getPrimaryCharacter(state.turnCycle.felix[0]!)?.shortName || ""} and ${getPrimaryCharacter(state.turnCycle.felix[1]!)?.shortName || ""} were both shot by ${getPrimaryCharacter(instigator)?.shortName || instigator.name}'s Felix-fortified Stupefy.`
              : `${getPrimaryCharacter(state.turnCycle.felix[0]!)?.shortName || ""} was shot by ${getPrimaryCharacter(instigator)?.shortName || instigator.name}'s Felix-fortified Stupefy.`
          )
        );
        state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
        return { handled: true };
      }

      return { handled: false };
    }
    case "fiendfyre": {
      if (action !== "draw") {
        return { handled: false };
      }

      const result = checkTopCardForHouses(state, [determineHouse(player, state)]);
      state.deck = result.deck;
      clearCurrentEvent(state);

      const burningPlayer = getPlayerById(state, state.turnCycle.hotseat);
      const instigator = event.instigator ? getPlayerById(state, event.instigator.id) : null;

      if (!burningPlayer || !instigator) {
        return { handled: false };
      }

      const fireIndex = cardsIndexName(burningPlayer.tableau, "fiendfyre");
      const [fireCard] = fireIndex === -1 ? [] : burningPlayer.tableau.splice(fireIndex, 1);

      if (result.gotIt) {
        if (fireCard) {
          const deck = cloneDeckState(state);
          deck.serveCard(fireCard);
          state.deck = deck;
        }

        state.events.push(
          createResolutionEvent(
            "You have extinguished the Fiendfyre!",
            [burningPlayer.id],
            `${getPrimaryCharacter(burningPlayer)?.shortName || burningPlayer.name} extinguished the Fiendfyre!`
          )
        );
        state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
        return { handled: true };
      }

      const burningCharacter = getPrimaryCharacter(burningPlayer);
      if (burningCharacter) {
        burningCharacter.health -= 1;
      }

      const nextTargetId = incrementTurn(
        burningPlayer.id,
        state.turnOrder,
        state.deadPlayers
      );
      const nextTarget = getPlayerById(state, nextTargetId);
      if (nextTarget && fireCard) {
        nextTarget.tableau.push(fireCard);
      }

      state.turnCycle.hotseat = nextTargetId;
      state.events.push({
        popup: {
          message: `${getPrimaryCharacter(instigator)?.shortName || instigator.name} cast Fiendfyre and ${getPrimaryCharacter(burningPlayer)?.shortName || burningPlayer.name} was burnt! Draw a card to see if you can extinguish it.`,
          options: [{ label: "Draw Card", function: "draw" }],
        },
        bystanders: createBystanderPopup(
          `${getPrimaryCharacter(instigator)?.shortName || instigator.name} cast Fiendfyre and ${getPrimaryCharacter(burningPlayer)?.shortName || burningPlayer.name} has been burnt! ${getPrimaryCharacter(nextTarget!)?.shortName || nextTarget?.name || "The next player"} must now draw to try to get past.`,
          "subtle"
        ),
        instigator,
        cardType: "fiendfyre",
        target: nextTarget ? [nextTarget.id] : [],
      });
      applySimpleDeaths(state);
      return { handled: true };
    }
    default:
      return { handled: false };
  }
}

export function handleRuleDeckClick(
  state: BoardViewState,
  pile: "draw" | "discard",
  pushAlert: PushAlert
): RuleResult {
  if (pile === "discard" && state.turnCycle.phase === "selected") {
    state.events.push({
      popup: {
        popupType: "subtle",
        message:
          state.turnCycle.cards.length > 1
            ? "Are you sure you want to discard these cards?"
            : "Are you sure you want to discard this card?",
        options: [
          { label: "yes", function: "dump" },
          { label: "no", function: "clear" },
        ],
      },
      instigator: viewerPlayer(state) ?? undefined,
      cardType: "discard",
      target: [state.playerId],
    });
    state.turnCycle.phase = "discard";
    state.turnCycle.action = "discardEvent";
    return { handled: true };
  }

  if (pile === "draw" && state.turnCycle.phase === "azkaban") {
    const player = viewerPlayer(state);
    if (!player) {
      return { handled: false };
    }

    const result = checkTopCardForHouses(state, [determineHouse(player, state)]);
    state.deck = result.deck;
    clearCurrentEvent(state);

    if (result.gotIt) {
      const azkabanIndex = cardsIndexName(player.tableau, "azkaban");
      const [azkabanCard] = azkabanIndex === -1 ? [] : player.tableau.splice(azkabanIndex, 1);
      if (azkabanCard) {
        const deck = cloneDeckState(state);
        deck.serveCard(azkabanCard);
        state.deck = deck;
      }

      state.events.push(
        createResolutionEvent(
          `Hooray! You drew a ${result.house} and escaped Azkaban.`,
          [player.id],
          `${getPrimaryCharacter(player)?.shortName || player.name} drew a ${result.house} and escaped Azkaban.`
        )
      );
      state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
      return { handled: true };
    }

    state.events.push(
      createResolutionEvent(
        `Bummer! You drew a ${result.house} and are still in Azkaban. You've lost this turn.`,
        [player.id],
        `${getPrimaryCharacter(player)?.shortName || player.name} failed to escape Azkaban and their turn has been skipped.`
      )
    );
    state.turnCycle.phase = "stuck-in-azkaban";
    pushAlert("You failed to escape Azkaban and have lost this turn.", "warning");
    return { handled: true };
  }

  return { handled: false };
}
