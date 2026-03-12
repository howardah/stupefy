const { encode, decode } = require("./encrypt");

const idGenerator = (currentArr) => {
  function createId() {
    return Math.floor(Math.random() * 100);
  }

  function someoneElses(id) {
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
