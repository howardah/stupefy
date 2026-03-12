const express = require("express");
const router = express.Router();
const querystring = require("querystring");
const {
  makeWaitRoom,
  getWaitRoom,
  joinWaitRoom,
} = require("../utils/waitingRoomDB");
const stupefyDB = require("../utils/stupefyDB.js");
const { encode } = require("../utils/encrypt");
require("dotenv").config();

router.get("/wait/create/", async function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from

  const query = querystring.parse(req.originalUrl.split("?")[1]);

  console.log(query);

  const dbResult = await makeWaitRoom(query);

  let value = dbResult ? dbResult : [];

  if (value[0] && value[0].password)
    value[0] = Object.assign(value[0], {
      password: encode(value[0].password, value[0].roomName.replace(" ", "_")),
    });

  console.log("============");
  console.log(value);
  console.log("============");

  res.send(value);
});

router.get("/wait/get/", async function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from

  const query = querystring.parse(req.originalUrl.split("?")[1]);
  const dbResult = await getWaitRoom(query);

  let value = dbResult ? dbResult : [];

  if (value[0] && value[0].password)
    value[0] = Object.assign(value[0], {
      password: encode(value[0].password, value[0].roomName.replace(" ", "_")),
    });

  console.log("============");
  console.log(value);
  console.log("============");

  res.send(value);
});

router.get("/wait/join/", async function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from

  const query = querystring.parse(req.originalUrl.split("?")[1]);
  const dbResult = await joinWaitRoom(query);

  let value = dbResult ? dbResult : [];

  if (value[0] && value[0].password)
    value[0] = Object.assign(value[0], {
      password: encode(value[0].password, value[0].roomName.replace(" ", "_")),
    });

  console.log("============");
  console.log(value);
  console.log("============");

  res.send(value);
});

router.get("/players/", async function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from

  const query = querystring.parse(req.originalUrl.split("?")[1]);

  console.log(query.room);

  let dbObject = await stupefyDB.getRoom(query.room);
  console.log(dbObject);
  // let dbObject = await getRoom(query.room).catch(console.error);
  res.send(dbObject);
});

router.get("/players/create-room/", async function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from

  const query = querystring.parse(req.originalUrl.split("?")[1]);

  console.log(query.room);

  let dbObject = await stupefyDB.makeRoom(query.room);
  console.log(dbObject);
  // let dbObject = await getRoom(query.room).catch(console.error);
  res.send(dbObject);
});

module.exports = router;
