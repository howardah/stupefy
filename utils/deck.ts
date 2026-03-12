export default class Deck<T> {
  cards: T[];
  discards: T[];

  constructor(cards: T[] = [], discards: T[] = []) {
    this.cards = cards;
    this.discards = discards;
  }

  getLength(): number {
    return this.cards.length;
  }

  drawCards(number: number, discard = false): T[] {
    if (discard) return this.discards.splice(0, number);
    if (this.cards.length === 0) this.shuffle();
    return this.cards.splice(0, number);
  }

  backToTheTop(card: T): void {
    this.cards.unshift(card);
  }

  serveCard(card: T): void {
    this.discards.unshift(card);
  }

  serveCards(cards: T[]): void {
    this.discards.unshift(...cards);
  }

  shuffle(): void {
    const toShuffle = [...this.cards, ...this.discards];

    for (let i = toShuffle.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * i);
      const temp = toShuffle[i]!;
      toShuffle[i] = toShuffle[j]!;
      toShuffle[j] = temp;
    }

    this.cards = toShuffle;
    this.discards = [];
  }
}
