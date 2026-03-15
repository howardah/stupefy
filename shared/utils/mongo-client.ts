import { MongoClient } from "mongodb";

export function getMongoUri(): string {
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

export function createMongoClient(): MongoClient {
  return new MongoClient(getMongoUri());
}
