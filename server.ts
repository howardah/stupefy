import type { Server as HttpServer } from "http";
import type { Socket } from "socket.io";
import type { WaitingChatMessage } from "./utils/types";

const path = require("path") as typeof import("path");
const http = require("http") as typeof import("http");
const express = require("express") as typeof import("express");
const { Server } = require("socket.io") as typeof import("socket.io");
const redis = require("socket.io-redis");
const sticky = require("sticky-session") as {
  listen(server: HttpServer, port: number | string): boolean;
};

// Import setup room functions
const stupefyDB = require("./utils/stupefyDB.js") as {
  updateRoom(room: string, data: Record<string, unknown>): Promise<unknown>;
};
const { newRoom } = require("./utils/new-room.js") as {
  newRoom(data: { players: unknown[]; room: string }): Promise<unknown>;
};
const { updateActive, addChat } = require("./utils/waitingRoomDB") as {
  addChat(data: { newChat: WaitingChatMessage; room: string }): Promise<unknown>;
  updateActive(data: {
    active?: Record<string, number | string>;
    data: Record<string, unknown>;
    room: string;
  }): Promise<unknown>;
};

const app = express();
const server = http.createServer(app as never);

const io = new Server(server);
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
interface WaitingRoomSocketState {
  sockets: Record<string, unknown>;
  users: Record<string, number | string>;
}

interface JoinWaitingRoomPayload {
  id: number | string;
  socketroom: string;
}

interface WaitingPlayersPayload {
  players: unknown[];
  socketroom: string;
}

interface RoomChangePayload {
  room: string;
  [key: string]: unknown;
}

interface TimedRoomPayload {
  room: string;
  time: number;
}

const rooms: Record<string, WaitingRoomSocketState> = {};

// Run when client connects
io.on("connection", (socket: Socket) => {
  const typedSocket = socket as Socket & {
    nickname?: number | string;
  };
  // Room variable for this connection
  let thisroom = "";

  // When user joins a room
  socket.on("join-waiting-room", (data: JoinWaitingRoomPayload) => {
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
    const activeRoom = rooms[thisroom]!;

    activeRoom.users[socket.id] = data.id;
    // add our id & the socket id to the object
    // so we can figure out who’s actively in the room
    typedSocket.nickname = data.id;
    // rooms[thisroom].push({ sid: socket.id, cid: data.id });
    const room = io.sockets.adapter.rooms.get(data.socketroom);

    activeRoom.sockets = room
      ? Object.fromEntries(Array.from(room.values()).map((id) => [id, true]))
      : {};

    // and send it to the other room members
    updateActive({
      room: thisroom.replace("-waiting", ""),
      active: activeRoom.users,
      data: { active: activeRoom.users },
    });
    io.in(data.socketroom).emit("from-the-waiting-room", {
      socket: activeRoom,
    });
  });

  socket.on("to-waiting-room", (data: JoinWaitingRoomPayload) => {
    // and send it to the other room members
    socket.to(data.socketroom).emit("from-the-waiting-room", rooms[thisroom]);
  });

  socket.on("waiting-players", (data: WaitingPlayersPayload) => {
    socket
      .to(data.socketroom)
      .emit("from-the-waiting-room", { players: data.players });
  });

  socket.on("waiting-chat", async (newChat: WaitingChatMessage) => {
    console.log("got it.");
    const chat = await addChat({
      room: thisroom.replace("-waiting", ""),
      newChat,
    });
    socket.to(thisroom).emit("from-the-waiting-room", { chat });
  });

  socket.on("set-up-game", async (data: { players: unknown[]; room: string }) => {
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

  socket.on("stupefy", (change: RoomChangePayload) => {
    // Send all data to the database
    stupefyDB.updateRoom(change.room, Object.assign(change));
    // and send it to the other room members
    socket.to(change.room).emit("from-the-room", change);
  });

  socket.on("join-room", (room: string) => {
    socket.join(room);
    console.log("Room: " + room);
  });

  socket.on("pause-room", (data: TimedRoomPayload) => {
    socket.to(data.room).emit("pause", data.time);
  });

  socket.on("resume-room", (data: TimedRoomPayload) => {
    socket.to(data.room).emit("resume", data.time);
  });

  // when user leaves the room
  socket.on("disconnect", (reason: string) => {
    // Make sure the room exists
    console.log("server was disconnected");

    // Remove the current connection ID from the waiting room members
    const activeRoom = rooms[thisroom];
    if (activeRoom && activeRoom.users[socket.id]) {
      delete activeRoom.users[socket.id];
      socket
        .to(thisroom)
        .emit("from-the-waiting-room", { socket: activeRoom });
      updateActive({
        room: thisroom.replace("-waiting", ""),
        data: { active: activeRoom.users },
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
      (typedSocket as unknown as { connect(): void }).connect?.();
    }
  });
});

const PORT = process.env.PORT || 3000;

if (!sticky.listen(server, PORT)) {
  // Master code
  server.once("listening", function () {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  // Worker code
}

// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
