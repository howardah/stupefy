export const Deck = class {
  constructor(cards, discards) {
    this.cards = cards || [];
    this.discards = discards || [];
  }

  getLength() {
    return this.cards.length;
  }

  drawCards(number, discard) {
    if (discard) return this.discards.splice(0, number);
    if (this.cards.length === 0) this.shuffle();
    return this.cards.splice(0, number);
  }

  drawCard(discard) {
    if (discard) return this.discards.splice(0, 1)[0];
    if (this.cards.length === 0) this.shuffle();
    return this.cards.splice(0, 1)[0];
  }

  backToTheTop(cards) {
    this.cards.unshift(cards);
  }

  serveCard(inCard) {
    this.discards.unshift(inCard);
  }
  serveCards(inCards) {
    this.discards.splice(0, 0, ...inCards);
  }

  copy() {
    return [this.cards, this.discards];
  }

  shuffle() {
    let toShuffle = [...this.cards, ...this.discards];

    for (let i = toShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * i);
      const temp = toShuffle[i];
      toShuffle[i] = toShuffle[j];
      toShuffle[j] = temp;
    }

    this.cards = toShuffle;
    this.discards = [];
  }
};
