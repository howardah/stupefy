const { initialise } = require("./card-setup");
const { camelCase } = require("lodash");
const { dbRequest } = require("./make_db_connection");

// const { initialise } = require("../utils/card-setup");
//Prevent problems by postponing db requests until
//the current requests are dealt with
var queue = {};

function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
}

async function getRoom(room) {
  if (queue[room] === undefined) queue[room] = { busy: false, data: {} };
  return new Promise(function (resolve, reject) {
    let currentRoom = room;
    // console.log(queue[currentRoom].busy);
    async function askForRoom(thisRoom) {
      if (!queue[currentRoom].busy) {
        console.log("call begins");
        console.log(thisRoom);
        queue[currentRoom].busy = true;
        let dataObj = await dbRequest(fetchRoom, { room: thisRoom }).catch(
          console.error
        );
        console.log("call ended");

        queue[currentRoom].busy = false;
        resolve(dataObj);
      } else {
        setTimeout(() => {
          askForRoom(thisRoom);
        }, 1000);
      }
    }
    askForRoom(currentRoom);
  });
}
async function updateRoom(room, data) {
  if (queue[room] === undefined) queue[room] = { busy: false, data: {} };
  let currentRoom = room,
    currentData = data;
  if (!queue[currentRoom].busy) {
    console.log("call begins");
    queue[currentRoom].busy = true;
    let dataObj = await dbRequest(setRoom, { room: room, data: data }).catch(
      console.error
    );
    console.log("call ended");
    queue[currentRoom].busy = false;
    if (!isEmpty(queue[currentRoom].data)) {
      let oldData = queue[currentRoom].data;
      queue[currentRoom].data = {};
      updateRoom(currentRoom, oldData);
    }
    return dataObj;
  } else {
    let currentQueue = queue[currentRoom].data;
    if (currentQueue === undefined) {
      queue[currentRoom].data = currentData;
    } else {
      queue[currentRoom].data = Object.assign(currentQueue, currentData);
      console.log(queue);
    }
  }
}

async function makeRoom(room) {
  return new Promise(function (resolve, reject) {
    let currentRoom = room;
    async function askForRoom(thisRoom) {
      console.log("call begins");
      console.log(thisRoom);
      let dataObj = await dbRequest(createRoom, { room: thisRoom }).catch(
        console.error
      );
      console.log("call ended");
      queue[currentRoom] = { busy: false, data: {} };
      resolve(dataObj);
    }
    askForRoom(currentRoom);
  });
}

async function fetchRoom(client, info) {
  const db = await client.db("stupefy");
  let returnData = await db.collection(camelCase(info.room)).find().toArray();
  if (
    returnData[0] === undefined ||
    returnData[0].players === undefined ||
    returnData[0].players.length === 0
  )
    returnData = false;

  console.log(returnData);
  return returnData;
}

async function createRoom(client, info) {
  const db = await client.db("stupefy");

  const names = await db.listCollections().toArray();
  const exists = names.some((coll) => {
    return coll.name === camelCase(info.room);
  });

  let returnData;

  if (exists) {
    returnData = await db.collection(camelCase(info.room)).find().toArray();
    if (
      returnData[0].players === undefined ||
      returnData[0].players.length === 0 ||
      returnData[0].deck === undefined
    ) {
      let obj = initialise();
      returnData = [obj];
      await setRoom(client, { room: info.room, data: returnData[0] });
    }
  } else {
    let obj = initialise();
    obj._id = 0;
    returnData = [obj];
    await db
      .collection(camelCase(info.room))
      .insertOne(Object.assign(obj, { last_updated: Date.now() }));
  }

  return returnData;
}

async function setRoom(client, info) {
  const db = await client.db("stupefy"),
    collection = await db.collection(camelCase(info.room));

  let current_object = await collection.findOne();

  // console.log(current_object);
  // console.log(info);
  //   let state = Object.assign(current_object, info.data);
  let new_object = Object.assign(current_object, info.data, {
    last_updated: Date.now(),
  });

  //   new_object.state = state;

  console.log("Set Room");
  finObj = await collection.updateOne(
    {},
    { $set: new_object },
    { upsert: true }
  );

  return finObj;
}

module.exports = { getRoom, updateRoom, makeRoom };
