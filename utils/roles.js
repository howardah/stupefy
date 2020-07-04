const roles = (length) => {
  let characters = [];

  // setup the possible roles based on the number of players
  switch (length) {
    case 2:
      characters = ["minister", "death eater"];
      break;
    case 3:
      characters = ["minister", "death eater", "werewolf"];
      break;
    case 4:
      characters = ["minister", "death eater", "death eater", "werewolf"];
      break;
    case 5:
      characters = [
        "minister",
        "death eater",
        "death eater",
        "werewolf",
        "auror",
      ];
      break;
    case 6:
      characters = [
        "minister",
        "death eater",
        "death eater",
        "death eater",
        "werewolf",
        "auror",
      ];
      break;
    case 7:
      characters = [
        "minister",
        "death eater",
        "death eater",
        "death eater",
        "werewolf",
        "auror",
        "auror",
      ];
      break;
    case 8:
      characters = [
        "minister",
        "death eater",
        "death eater",
        "death eater",
        "werewolf",
        "werewolf",
        "auror",
        "auror",
      ];
      break;
    case 9:
      characters = [
        "minister",
        "death eater",
        "death eater",
        "death eater",
        "death eater",
        "werewolf",
        "werewolf",
        "auror",
        "auror",
      ];
      break;
    default:
      break;
  }

  function shuffle() {
    let toShuffle = [...characters];

    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * i);
      const temp = toShuffle[i];
      toShuffle[i] = toShuffle[j];
      toShuffle[j] = temp;
    }

    characters = toShuffle;
  }

  shuffle();
  shuffle();
  shuffle();

  return characters;
};
module.exports = roles;
