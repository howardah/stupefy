import type {
  BoardViewState,
  DeckState,
  GameEvent,
  GameState,
  PlayerState,
  TurnCycle,
} from "../types";
import { cloneDeck, getPrimaryCharacter, playerIndex, cardsIncludeName } from "./core";
import { handLimitForPlayer, hasPower } from "./powers";

export function hasUnlimitedShots(player: PlayerState): boolean {
  const character = getPrimaryCharacter(player);

  return (
    cardsIncludeName(player.tableau, "elder_wand") ||
    character?.fileName === "sirius_black"
  );
}

export function createBaseTurnCycle(players: PlayerState[], activeTurn: number): TurnCycle {
  const player = players[playerIndex(players, activeTurn)];
  const draw =
    player && hasPower(player, "fred_and_george")
      ? 3
      : 2;

  return {
    action: "",
    cards: [],
    felix: [],
    draw,
    hotseat: -1,
    phase: "initial",
    shots: player && hasUnlimitedShots(player) ? 9999 : 1,
    used: [],
  };
}

export function createAzkabanEvent(player: PlayerState, turn: number): GameEvent {
  const character = getPrimaryCharacter(player);
  const shortName = character?.shortName || player.name;

  return {
    popup: {
      message: "You’re in Azkaban! Draw a card to see if you get out",
      options: [],
      popupType: "subtle",
    },
    bystanders: {
      message: `${shortName} is in Azkaban! They must draw to see if they get out.`,
      options: [],
      popupType: "subtle",
    },
    instigator: player,
    cardType: "azkaban",
    target: [turn],
  };
}

export function setupTurnCycleForTurn(
  players: PlayerState[],
  turn: number
): { events?: GameEvent[]; turnCycle: TurnCycle } {
  const turnCycle = createBaseTurnCycle(players, turn);
  const currentPlayer = players[playerIndex(players, turn)];

  if (currentPlayer && cardsIncludeName(currentPlayer.tableau, "azkaban")) {
    return {
      events: [createAzkabanEvent(currentPlayer, turn)],
      turnCycle: {
        ...turnCycle,
        action: "azkaban",
        phase: "azkaban",
      },
    };
  }

  if (currentPlayer?.power.includes("peeves")) {
    const availableVictims = players.some(
      (player) => player.id !== currentPlayer.id && player.hand.length > 0,
    );

    if (availableVictims) {
      turnCycle.action = "peeves_draw";
      turnCycle.phase = "start-turn";

      return {
        events: [
          {
            popup: {
              message: "Use Peeves' power to steal your first draw from another player's hand?",
              options: [
                { label: "Yes", function: "start_yes" },
                { label: "No", function: "start_no" },
              ],
              popupType: "subtle",
            },
            bystanders: {
              message: `${getPrimaryCharacter(currentPlayer)?.shortName || currentPlayer.name} is choosing whether to use Peeves' power.`,
              options: [],
              popupType: "subtle",
            },
            cardType: "peeves",
            target: [turn],
          },
        ],
        turnCycle,
      };
    }
  }

  if (currentPlayer?.power.includes("peter_pettigrew")) {
    const availableVictims = players.some(
      (player) => player.id !== currentPlayer.id && player.tableau.length > 0,
    );

    if (availableVictims) {
      turnCycle.action = "peter_pettigrew";
      turnCycle.phase = "start-turn";

      return {
        events: [
          {
            popup: {
              message: "Use Peter Pettigrew's power instead of drawing two cards?",
              options: [
                { label: "Yes", function: "start_yes" },
                { label: "No", function: "start_no" },
              ],
              popupType: "subtle",
            },
            bystanders: {
              message: `${getPrimaryCharacter(currentPlayer)?.shortName || currentPlayer.name} is choosing whether to use Peter Pettigrew's power.`,
              options: [],
              popupType: "subtle",
            },
            cardType: "peter_pettigrew",
            target: [turn],
          },
        ],
        turnCycle,
      };
    }
  }

  if (currentPlayer?.power.includes("ron_weasley") && players.length > 0) {
    turnCycle.action = "ron_weasley";
    turnCycle.phase = "start-turn";

    return {
      events: [
        {
          popup: {
            message: "Draw your first card from the discard pile instead of the draw pile?",
            options: [
              { label: "Yes", function: "start_yes" },
              { label: "No", function: "start_no" },
            ],
            popupType: "subtle",
          },
          bystanders: {
            message: `${getPrimaryCharacter(currentPlayer)?.shortName || currentPlayer.name} is choosing how to start the turn.`,
            options: [],
            popupType: "subtle",
          },
          cardType: "ron_weasley",
          target: [turn],
        },
      ],
      turnCycle,
    };
  }

  return { turnCycle };
}

export function cycleCleanse(
  turnCycle: TurnCycle,
  players: PlayerState[],
  turn: number
): TurnCycle {
  const next = createBaseTurnCycle(players, turn);

  return {
    ...turnCycle,
    action: next.action,
    cards: next.cards,
    felix: next.felix,
    hotseat: next.hotseat,
    phase: next.phase,
    shots: next.shots,
  };
}

export function incrementTurn(
  currentTurn: number,
  turnOrder: number[],
  deadPlayers: number[]
): number {
  let turnIndex = turnOrder.indexOf(currentTurn);
  if (turnIndex === -1) {
    return turnOrder[0] ?? currentTurn;
  }

  turnIndex += 1;
  if (turnIndex >= turnOrder.length) turnIndex = 0;

  while (deadPlayers.includes(turnOrder[turnIndex] ?? -1)) {
    turnIndex += 1;
    if (turnIndex >= turnOrder.length) turnIndex = 0;
  }

  return turnOrder[turnIndex] ?? currentTurn;
}

export function clearTable(
  table: GameState["table"],
  inputDeck: DeckState,
  number = table?.length ?? 0
): false | { deck: DeckState; table: NonNullable<GameState["table"]> } {
  const currentTable = [...(table || [])];
  if (currentTable.length === 0) return false;

  const deck = cloneDeck(inputDeck);

  for (let i = number; i > 0; i -= 1) {
    const card = currentTable.pop();
    if (card) {
      deck.discards.unshift(card);
    }
  }

  return {
    deck,
    table: currentTable,
  };
}

export function endTurnState(
  state: Pick<BoardViewState, "deck" | "players" | "table" | "turn">
): { alert?: string; nextState: Partial<BoardViewState> } | false {
  const players = state.players.map((player) => ({
    ...player,
    character: Array.isArray(player.character)
      ? [...player.character]
      : { ...player.character },
    hand: [...player.hand],
    power: [...player.power],
    tableau: [...player.tableau],
  }));
  const currentIndex = playerIndex(players, state.turn);
  const player = players[currentIndex];

  if (!player) return false;

  let nextDeck = cloneDeck(state.deck);

  if (cardsIncludeName(player.tableau, "azkaban")) {
    const jailLocation = player.tableau.findIndex((card) => card.name === "azkaban");
    const jailedCard = player.tableau.splice(jailLocation, 1)[0];

    if (jailedCard) {
      nextDeck.discards.unshift(jailedCard);
    }
  }

  const cleared = clearTable(state.table, nextDeck);
  if (cleared) {
    nextDeck = cleared.deck;
  }

  const handLimit = handLimitForPlayer(player);

  if (player.hand.length > handLimit) {
    return {
      alert: `You must discard until you have at most ${handLimit} cards in hand.`,
      nextState: {},
    };
  }

  return {
    nextState: {
      deck: nextDeck,
      players,
      table: cleared ? cleared.table : state.table,
    },
  };
}
