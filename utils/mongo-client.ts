const { MongoClient } = require("mongodb");

function getMongoUri(): string {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;

  return (
    "mongodb+srv://" +
    process.env.MONGO_STUPEFY_UN +
    ":" +
    process.env.MONGO_STUPEFY_PW +
    "@" +
    process.env.MONGO_STUPEFY_CLUSTER +
    ".mongodb.net/stupefy?retryWrites=true&w=majority"
  );
}

function createMongoClient() {
  return new MongoClient(getMongoUri());
}

module.exports = { createMongoClient, getMongoUri };
