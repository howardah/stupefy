import type { BoardViewState, GameEvent } from "../../types";
import { cardsIncludeName, getPrimaryCharacter } from "../core";
import { createResolutionEvent } from "../events";
import { ignoresOpposingTableau } from "../powers";
import { cycleCleanse } from "../turn-cycle";
import {
  activePlayer,
  createBystanderPopup,
  discardSelected,
  viewerPlayer,
} from "./shared";

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
        ? player.id !== instigator.id &&
          (ignoresOpposingTableau(instigator) || !cardsIncludeName(player.tableau, "expecto_patronum"))
        : true,
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
      cardType === "dementors"
        ? "Whoosh, you're past the Dementors now!"
        : "Whoosh, you're safe now!",
      "subtle",
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
  state.events.push(
    createResolutionEvent(
      message,
      [player.id],
      message.replace("You", getPrimaryCharacter(player)?.shortName || player.name),
    ),
  );
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
      `${getPrimaryCharacter(bartender)?.shortName || bartender.name} played the Three Broomsticks and everyone has been healed for 1 point!`,
    ),
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
        "subtle",
      ),
      bystanders: createBystanderPopup(
        isCurrentPlayer
          ? "Everyone else is choosing their cards."
          : `${getPrimaryCharacter(instigator)?.shortName || instigator.name} has played Diagon Alley!`,
        "subtle",
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

export {
  startDiagonAlley,
  startMassEvent,
  startSelfBuff,
  startThreeBroomsticks,
};
