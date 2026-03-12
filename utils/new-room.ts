const { initialise } = require("./card-setup");
const { createMongoClient } = require("./mongo-client");

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
  let data;
  const client = createMongoClient();

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
