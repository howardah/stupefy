const { initialise } = require("./card-setup");
const { dbRequest } = require("./make_db_connection");

function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
}

async function newRoom(data) {
  let dataObj = await dbRequest(createRoom, data).catch(console.error);
  console.log("call ended");
  return dataObj;
}

// tim

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
