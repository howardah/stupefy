const MongoClient = require("mongodb").MongoClient;

const stupefy_db_uri =
  "mongodb+srv://" +
  process.env.MONGO_STUPEFY_UN +
  ":" +
  process.env.MONGO_STUPEFY_PW +
  "@" +
  process.env.MONGO_STUPEFY_CLUSTER +
  ".mongodb.net/stupefy?retryWrites=true&w=majority";

async function dbRequest(dbCall, details) {
  let data;
  const client = new MongoClient(stupefy_db_uri);

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Make the appropriate DB calls
    data = await dbCall(client, details);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }

  return data;
}

module.exports = { dbRequest };
