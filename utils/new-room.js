const MongoClient = require("mongodb").MongoClient;
const { initialise } = require("./card-setup");

function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
}

async function newRoom(data) {
  let dataObj = await roomRequest(data).catch(console.error);
  console.log("call ended");
  return dataObj;
}

async function roomRequest(details) {
  /**
   * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
   * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
   */
  const stupefyUri =
    "mongodb+srv://" +
    process.env.MONGO_STUPEFY_UN +
    ":" +
    process.env.MONGO_STUPEFY_PW +
    "@" +
    process.env.MONGO_STUPEFY_CLUSTER +
    ".mongodb.net/stupefy?retryWrites=true&w=majority";
  let data;
  const client = new MongoClient(stupefyUri);

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Make the appropriate DB calls
    data = await createRoom(client, details);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }

  return data;
}

async function createRoom(client, info) {
  const db = await client.db("stupefy");

  const names = await db.listCollections().toArray();
  const exists = names.some((coll) => {
    return coll.name === info.room;
  });

  let obj = initialise(info.players);
  obj._id = 0;

  if (exists) {
    await db.collection(info.room).remove({});
  }

  await db
    .collection(info.room)
    .insertOne(Object.assign(obj, { last_updated: Date.now() }));

  return [obj];
}

module.exports = { newRoom };
