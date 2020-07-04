const MongoClient = require("mongodb").MongoClient;
const camelCase = require("lodash/camelCase");
const { idGenerator, decode } = require("./db-tools");

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

async function getWaitRoom(data) {
  return new Promise(function (resolve, reject) {
    let currentRoom = data.room;

    async function askForRoom(thisRoom) {
      console.log("call begins");
      console.log(thisRoom);
      let dataObj = await roomRequest("get", data).catch(console.error);
      console.log("call ended");
      resolve(dataObj);
    }
    askForRoom(currentRoom);
  });
}

async function joinWaitRoom(data) {
  return new Promise(function (resolve, reject) {
    let currentRoom = data.room;

    async function askForRoom(thisRoom) {
      console.log("call begins");
      console.log(thisRoom);
      let dataObj = await roomRequest("join", data).catch(console.error);
      console.log("call ended");
      resolve(dataObj);
    }
    askForRoom(currentRoom);
  });
}

async function updateActive(data) {
  return new Promise(function (resolve, reject) {
    let currentRoom = data.room;

    async function askForRoom(thisRoom) {
      console.log("call begins");
      console.log(thisRoom);
      let dataObj = await roomRequest("active", data).catch(console.error);
      console.log("call ended");
      resolve(dataObj);
    }
    askForRoom(currentRoom);
  });
}

async function addChat(data) {
  console.log("call begins");
  let dataObj = await roomRequest("chat", data).catch(console.error);
  console.log("call ended");
  return dataObj[0].chat;
}

async function makeWaitRoom(info) {
  const roomKey = camelCase(info.room),
    players = [{ name: info.player, id: idGenerator([]) }],
    password = info.pw || false;

  const newRoom = {
    players,
    password,
    roomName: info.room,
    chat: [
      {
        text:
          "Once everyone has joined the room, you can click “Start Game” to set up the actual game.",
        player: 100,
        time: Date.now(),
      },
    ],
  };

  return new Promise(function (resolve, reject) {
    let currentRoom = roomKey;
    async function askForRoom(thisRoom) {
      console.log("call begins");
      console.log(thisRoom);
      let dataObj = await roomRequest("make", { roomKey, room: newRoom }).catch(
        console.error
      );
      console.log("call ended");
      queue[currentRoom] = { busy: false, data: {} };
      resolve(dataObj);
    }
    askForRoom(currentRoom);
  });
}

async function roomRequest(request, details) {
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
    switch (request) {
      case "update":
        data = await setRoom(client, details);
        break;
      case "join":
        data = await joinRoom(client, details);
        break;
      case "get":
        data = await fetchWaitRoom(client, details);
        break;
      case "active":
        data = await setWaitingRoom(client, details);
        break;
      case "chat":
        data = await addChatToRoom(client, details);
        break;
      case "make":
        data = await createWaitingRoom(client, details);
        break;
      default:
        console.log("No valid request specified");
        break;
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }

  return data;
}

async function fetchRoom(client, info) {
  const db = await client.db("stupefy");
  let returnData = await db.collection(info.room).find().toArray();
  if (
    returnData[0] === undefined ||
    returnData[0].players === undefined ||
    returnData[0].players.length === 0
  )
    returnData = false;

  console.log(returnData);
  return returnData;
}

async function fetchWaitRoom(client, info) {
  const db = await client.db("waiting_room");
  let returnData = await db.collection(camelCase(info.room)).find().toArray();

  console.log(decode(info.key, info.room.replace(" ", "_")));

  if (
    returnData[0].password &&
    returnData[0].password !== decode(info.key, info.room.replace(" ", "_"))
  )
    return [{ error: "password incorrect" }];

  const currentUsers = returnData[0].players;

  console.log(currentUsers);
  console.log(info);

  if (!currentUsers.some((player) => player.id == info.id))
    return [{ error: "user not found" }];

  console.log("RETURN DATA");
  console.log(returnData);

  return returnData;
}

async function joinRoom(client, info) {
  const db = await client.db("waiting_room"),
    collection = await db.collection(camelCase(info.room));

  let current_object = await collection.findOne();

  if (current_object.password && current_object.password !== info.pw)
    return [{ error: "password incorrect" }];

  for (let i = 0; i < current_object.players.length; i++) {
    if (current_object.players[i].name === info.player) {
      console.log("player name is the same!");

      for (let socket in current_object.active) {
        if (
          Number(current_object.active[socket]) === current_object.players[i].id
        )
          return [
            {
              error:
                "There is another active user with the same name! Choose a different name.",
            },
          ];
      }

      current_object.players[i].id;
    }
  }

  let players = current_object.players;

  players.push({ name: info.player, id: idGenerator([]) });

  let new_object = Object.assign(current_object, { players });

  console.log(new_object);

  // console.log("Set Room");
  finObj = await collection.updateOne(
    {},
    { $set: new_object },
    { upsert: true }
  );

  return [new_object];
}

async function addChatToRoom(client, info) {
  const db = await client.db("waiting_room"),
    collection = await db.collection(camelCase(info.room));

  let current_object = await collection.findOne();

  let chats = [...current_object.chat];

  chats.push(info.newChat);

  let new_object = Object.assign(current_object, { chat: chats });

  finObj = await collection.updateOne(
    {},
    { $set: new_object },
    { upsert: true }
  );

  return [new_object];
}

async function setWaitingRoom(client, info) {
  const db = await client.db("waiting_room"),
    collection = await db.collection(camelCase(info.room));

  let current_object = await collection.findOne();

  let new_object = Object.assign(current_object, info.data);

  finObj = await collection.updateOne(
    {},
    { $set: new_object },
    { upsert: true }
  );

  return [new_object];
}

async function createWaitingRoom(client, info) {
  const db = await client.db("waiting_room");

  const collections = await db.listCollections().toArray();
  const exists = collections.findIndex((coll) => {
    return coll.name === info.roomKey;
  });

  let returnData = [info.room];

  if (exists === -1) {
    await db
      .collection(info.roomKey)
      .insertOne(Object.assign(info.room, { last_updated: Date.now() }));
  } else {
    // If the room exists, we need to see how long it’s been around
    // and how long it’s been since it’s been used

    // How long since the room was set up
    const collection = await db.collection(info.roomKey).find().toArray();
    const how_long_creation = Date.now() - collection[0].last_updated;

    // How long since it's been used
    const gameInfo = await fetchRoom(client, { room: info.room.roomName });
    const how_long_played = gameInfo[0]
      ? Date.now() - gameInfo[0].last_updated
      : false;

    // Rooms will expire after 2 days after last play
    if (!how_long_played || how_long_played / 86400000 > 2) {
      // Unstarted rooms expire after 2 hours
      if (how_long_creation / 3600000 > 2) {
        // If the room is expired,
        // update it with the new information

        await db.collection(info.roomKey).updateOne(
          {},
          {
            $set: Object.assign(info.room, { last_updated: Date.now() }),
          },
          { upsert: true }
        );
      } else {
        console.log(
          "Room created " +
            Math.floor(how_long_creation / 60000) +
            " minutes ago."
        );
        return false;
      }
    } else {
      console.log(
        "Room last used " +
          Math.floor(how_long_played / 3600000) +
          " hours ago."
      );
      return false;
    }
  }

  return returnData;
}

module.exports = {
  getWaitRoom,
  joinWaitRoom,
  makeWaitRoom,
  updateActive,
  addChat,
};
