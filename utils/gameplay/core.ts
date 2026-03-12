import type {
  BoardViewState,
  CharacterCard,
  DeckState,
  GameCard,
  PlayerState,
} from "../types";

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

export function cardsIncludeName(cards: GameCard[], name: string): boolean {
  return cards.some((card) => card.name === name);
}

export function cardIndex(cards: GameCard[], findCard: GameCard | GameCard[]): number {
  if (Array.isArray(findCard)) {
    return cards.findIndex((card) =>
      findCard.some((candidate) => card.id === candidate.id)
    );
  }

  return cards.findIndex((card) => card.id === findCard.id);
}

export function cardsIndexName(cards: GameCard[], name: string): number {
  return cards.findIndex((card) => card.name === name);
}

export function playerIndex(players: PlayerState[], id: number): number {
  return players.findIndex((player) => player.id === id);
}

export function getPrimaryCharacter(player: PlayerState): CharacterCard | null {
  if (Array.isArray(player.character)) {
    return player.character[0] ?? null;
  }

  return player.character ?? null;
}

export function cloneDeck(deck: DeckState): DeckState {
  return {
    ...deck,
    cards: [...deck.cards],
    discards: [...deck.discards],
  };
}

export function clonePlayers(players: PlayerState[]): PlayerState[] {
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
