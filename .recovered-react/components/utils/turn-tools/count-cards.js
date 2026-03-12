export const countAllCards = (that) => {
  let count = [...that.state.deck.cards, ...that.state.deck.discards];

  that.state.players.forEach((player) => {
    count.push(...player.hand);
    count.push(...player.tableau);
  });

  let length = count.length;

  let unique = [],
    catcher = [];

  count.forEach((card) => {
    if (!unique.includes(card.id)) {
      unique.push(card.id);
    } else {
      catcher.push(card.id);
    }
  });

  let duplicates = length - unique.length;

  return { length: length, duplicates: duplicates, catcher: catcher };
};
