import type { BoardViewState, GameCard, PlayerState } from "../../types";
import { cardIndex, cardsInclude, getPrimaryCharacter, titleCase } from "../core";
import { createResolutionEvent, protegoOptions } from "../events";
import { cycleCleanse } from "../turn-cycle";
import { applyDamage } from "./damage";
import {
  activePlayer,
  cloneDeckState,
  createBystanderPopup,
  discardSelected,
  type PushAlert,
  viewerPlayer,
} from "./shared";

function startStupefy(state: BoardViewState, subject: PlayerState) {
  const discarded = discardSelected(state);
  const instigator = activePlayer(state);

  if (!discarded || !instigator) {
    return false;
  }

  state.deck = discarded.deck;
  state.turnCycle.shots -= 1;
  state.turnCycle.hotseat = subject.id;
  state.turnCycle.phase = "attack";

  const options = protegoOptions(
    subject,
    [
      { label: "Take a hit", function: "takeHit" },
      { label: "Play Protego", function: "playProtego" },
    ],
    instigator,
  );

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
        "subtle",
      ),
      [`bystanders-${instigator.id}`]: createBystanderPopup(
        `You have fired a Stupefy at ${getPrimaryCharacter(subject)?.shortName || subject.name}!`,
        "subtle",
      ),
    },
  ];

  return true;
}

function startFreeStupefy(state: BoardViewState, subject: PlayerState, selfDamage = false) {
  const instigator = activePlayer(state);

  if (!instigator) {
    return false;
  }

  if (selfDamage) {
    applyDamage(state, instigator, 1, { source: "dobby" });
  }

  state.turnCycle.hotseat = subject.id;
  state.turnCycle.phase = "attack";

  const options = protegoOptions(
    subject,
    [
      { label: "Take a hit", function: "takeHit" },
      { label: "Play Protego", function: "playProtego" },
    ],
    instigator,
  );

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
        "subtle",
      ),
      [`bystanders-${instigator.id}`]: createBystanderPopup(
        `You have fired a Stupefy at ${getPrimaryCharacter(subject)?.shortName || subject.name}!`,
        "subtle",
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
      "warning",
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
        "subtle",
      ),
      bystanders: createBystanderPopup(
        `${getPrimaryCharacter(instigator)?.shortName || instigator.name} has challenged ${getPrimaryCharacter(subject)?.shortName || subject.name} to a Wizard's Duel!`,
        "subtle",
      ),
      instigator,
      cardType: "wizards_duel",
      target: [subject.id],
    },
  ];

  return true;
}

function startFiendfyre(state: BoardViewState, subjectPlayerId: number) {
  const subject = state.players.find((player) => player.id === subjectPlayerId);
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
      "subtle",
    ),
    instigator,
    cardType: "fiendfyre",
    target: [subject.id],
  });

  return true;
}

function resolveAccio(state: BoardViewState, subject: PlayerState, card: GameCard) {
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
      `${getPrimaryCharacter(instigator)?.shortName || instigator.name} used a summoning charm to steal ${hand ? "from " : ""}${getPrimaryCharacter(subject)?.shortName || subject.name}'s ${hand ? "hand." : `${titleCase(card.name.replaceAll("_", " "))}.`}`,
    ),
  );
  state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
  return true;
}

function resolveExpelliarmus(state: BoardViewState, subject: PlayerState, card: GameCard) {
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
      `${getPrimaryCharacter(instigator)?.shortName || instigator.name} discarded ${getPrimaryCharacter(subject)?.shortName || subject.name}'s ${titleCase(card.name.replaceAll("_", " "))}.`,
    ),
  );
  state.turnCycle = cycleCleanse(state.turnCycle, state.players, state.turn);
  return true;
}

export {
  resolveAccio,
  resolveExpelliarmus,
  startFelixSelection,
  startFiendfyre,
  startFreeStupefy,
  startStupefy,
  startWizardsDuel,
};
