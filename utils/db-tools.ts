const { encode, decode } = require("./encrypt");

type HasId = {
  id: number;
};

const idGenerator = (currentArr: HasId[]): number => {
  function createId(): number {
    return Math.floor(Math.random() * 100);
  }

  function someoneElses(id: number): boolean {
    return currentArr.some((obj) => obj.id === id);
  }

  // Create a random id
  let id = createId();

  // If it's taken, keep making
  // ids until you get a unique one
  while (someoneElses(id)) {
    id = createId();
  }

  return id;
};

module.exports = { idGenerator, encode, decode };
