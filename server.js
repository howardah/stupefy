const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const redis = require("socket.io-redis");
const sticky = require("sticky-session");

// Import setup room functions
const stupefyDB = require("./utils/stupefyDB.js");
const { newRoom } = require("./utils/new-room.js");
const { updateActive, addChat } = require("./utils/waitingRoomDB");

const app = express();
const server = http.createServer(app);

const io = socketio(server);
// io.adapter(redis({ host: process.env.REDIS_ENDPOINT, port: 6379 }));

const stuRouter = require("./routes/index");
const dataRouter = require("./routes/database");

// View location
app.set("views", path.join(__dirname, "public"));

// Setup routes
app.use("/database", dataRouter);
app.use("/", stuRouter);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Global object to store information about all rooms
let rooms = {};

io.set("origins", "*:*");
// Run when client connects
io.on("connection", (socket) => {
  // Room variable for this connection
  let thisroom = "";

  // When user joins a room
  socket.on("join-waiting-room", (data) => {
    console.log("anybody there??");
    // Join the socket for this waiting room
    socket.join(data.socketroom);
    // set room name
    thisroom = data.socketroom;

    console.log(thisroom);

    if (rooms[thisroom] === undefined) {
      // If the room doesn't exist
      rooms[thisroom] = { users: {}, sockets: {} };
    }

    rooms[thisroom].users[socket.id] = data.id;
    // add our id & the socket id to the object
    // so we can figure out who’s actively in the room
    socket.nickname = data.id;
    // rooms[thisroom].push({ sid: socket.id, cid: data.id });
    let room = io.sockets.adapter.rooms[data.socketroom];

    rooms[thisroom].sockets = room.sockets;

    // and send it to the other room members
    updateActive({
      room: thisroom.replace("-waiting", ""),
      active: rooms[thisroom].users,
      data: { active: rooms[thisroom].users },
    });
    io.in(data.socketroom).emit("from-the-waiting-room", {
      socket: rooms[thisroom],
    });
  });

  socket.on("to-waiting-room", (data) => {
    // and send it to the other room members
    socket.to(data.socketroom).emit("from-the-waiting-room", rooms[thisroom]);
  });

  socket.on("waiting-players", (data) => {
    socket
      .to(data.socketroom)
      .emit("from-the-waiting-room", { players: data.players });
  });

  socket.on("waiting-chat", async (newChat) => {
    console.log("got it.");
    const chat = await addChat({
      room: thisroom.replace("-waiting", ""),
      newChat,
    });
    socket.to(thisroom).emit("from-the-waiting-room", { chat });
  });

  socket.on("set-up-game", async (data) => {
    io.in(thisroom).emit("from-the-waiting-room", {
      startState: false,
    });
    const game = await newRoom(data);

    console.log(data.room);

    console.log(game);

    io.in(thisroom).emit("from-the-waiting-room", {
      gameState: true,
    });
  });

  socket.on("stupefy", (change) => {
    // Send all data to the database
    stupefyDB.updateRoom(change.room, Object.assign(change));
    // and send it to the other room members
    socket.to(change.room).emit("from-the-room", change);
  });

  socket.on("join-room", (room) => {
    socket.join(room);
    console.log("Room: " + room);
  });

  socket.on("pause-room", (data) => {
    socket.to(data.room).emit("pause", data.time);
  });

  socket.on("resume-room", (data) => {
    socket.to(data.room).emit("resume", data.time);
  });

  // when user leaves the room
  socket.on("disconnect", (reason) => {
    // Make sure the room exists
    console.log("server was disconnected");

    // Remove the current connection ID from the waiting room members
    if (rooms[thisroom] && rooms[thisroom].users[socket.id]) {
      delete rooms[thisroom].users[socket.id];
      socket
        .to(thisroom)
        .emit("from-the-waiting-room", { socket: rooms[thisroom] });
      updateActive({
        room: thisroom.replace("-waiting", ""),
        data: { active: rooms[thisroom].users },
      });
    }
    // rooms[thisroom].splice(rooms[thisroom].indexOf(socket.id), 1);
    // }

    // If no one is in the room after 2 hours delete the room
    // setTimeout(function () {
    //   if (
    //     rooms[thisroom] !== undefined &&
    //     rooms[thisroom].members.length === 0
    //   ) {
    //     delete rooms[thisroom];
    //   }
    // }, 7200000);

    // If it was the servers fault, reconnect them
    if (reason === "io server disconnect") {
      console.log("Reconnecting...");
      socket.connect();
    }
  });
});

const PORT = process.env.PORT || 8080;

if (!sticky.listen(server, PORT)) {
  // Master code
  server.once("listening", function () {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  // Worker code
}

// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
