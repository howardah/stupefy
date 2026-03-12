import type {
  BoardViewState,
  DeckState,
  GameCard,
  GameEvent,
  GameState,
  PlayQuery,
  PlayerState,
  PopupState,
} from "../types";

function clonePlayers(players: PlayerState[]): PlayerState[] {
  return players.map((player) => ({
    ...player,
    character: Array.isArray(player.character)
      ? [...player.character]
      : { ...player.character },
    hand: [...player.hand],
    power: [...player.power],
    tableau: [...player.tableau],
  }));
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function cardsInclude(cards: GameCard[], findCard: GameCard): boolean {
  return cards.some((card) => card.id === findCard.id);
}

export function cardIndex(cards: GameCard[], findCard: GameCard | GameCard[]): number {
  if (Array.isArray(findCard)) {
    return cards.findIndex((card) =>
      findCard.some((candidate) => card.id === candidate.id)
    );
  }

  return cards.findIndex((card) => card.id === findCard.id);
}

export function playerIndex(players: PlayerState[], id: number): number {
  return players.findIndex((player) => player.id === id);
}

export function sortPlayers(
  givenPlayers: PlayerState[],
  givenOrder: number[]
): PlayerState[] {
  const players = clonePlayers(givenPlayers);
  const sortedPlayers: PlayerState[] = [];

  givenOrder.forEach((id) => {
    const index = playerIndex(players, id);
    if (index !== -1) {
      sortedPlayers.push(players[index]!);
    }
  });

  return sortedPlayers;
}

export function getPopupState(
  events: GameEvent[] | undefined,
  playerId: number
): PopupState {
  if (events?.[0]) {
    const firstEvent = events[0];

    if (firstEvent.target.includes(playerId) && firstEvent.popup) {
      return firstEvent.popup;
    }

    const bystanderPopup = firstEvent[`bystanders-${playerId}`];
    if (bystanderPopup && typeof bystanderPopup === "object") {
      return bystanderPopup as PopupState;
    }

    if (firstEvent.bystanders) {
      return firstEvent.bystanders;
    }
  }

  return { message: "", options: [] };
}

export function countAllCards(state: Pick<BoardViewState, "deck" | "players">) {
  const count = [...state.deck.cards, ...state.deck.discards];

  state.players.forEach((player) => {
    count.push(...player.hand);
    count.push(...player.tableau);
  });

  const unique: number[] = [];
  const catcher: number[] = [];

  count.forEach((card) => {
    if (card.id === undefined) return;
    if (!unique.includes(card.id)) {
      unique.push(card.id);
    } else {
      catcher.push(card.id);
    }
  });

  return {
    catcher,
    duplicates: count.length - unique.length,
    length: count.length,
  };
}

export function createBoardViewState(
  setupObj: GameState,
  query: PlayQuery
): BoardViewState {
  const players = sortPlayers(setupObj.players, setupObj.turnOrder);
  const events = setupObj.events || [];

  return {
    actions: getPopupState(events, query.id),
    alerts: [],
    deadPlayers: setupObj.deadPlayers || [],
    deck: setupObj.deck as DeckState,
    events,
    playerId: query.id,
    playerRoom: query.room,
    players,
    running: true,
    showCards: true,
    table: setupObj.table || [],
    turn: setupObj.turn,
    turnCycle: setupObj.turnCycle,
    turnOrder: setupObj.turnOrder,
  };
}
