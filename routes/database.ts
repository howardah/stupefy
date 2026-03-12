import type { NextFunction, Request, Response } from "express";
import type {
  ErrorResult,
  WaitingRoomCreateQuery,
  WaitingRoomGetQuery,
  WaitingRoomJoinQuery,
  WaitingRoomState,
} from "../utils/types";

const express = require("express") as typeof import("express");
const router = express.Router();
const querystring = require("querystring") as typeof import("querystring");
const { makeWaitRoom, getWaitRoom, joinWaitRoom } = require(
  "../utils/waitingRoomDB"
) as {
  getWaitRoom(query: WaitingRoomGetQuery): Promise<unknown>;
  joinWaitRoom(query: WaitingRoomJoinQuery): Promise<unknown>;
  makeWaitRoom(query: WaitingRoomCreateQuery): Promise<unknown>;
};
const stupefyDB = require("../utils/stupefyDB.js") as {
  getRoom(room: string): Promise<unknown>;
  makeRoom(room: string): Promise<unknown>;
};
const { encode } = require("../utils/encrypt") as {
  encode(message: string, key: string): string;
};
require("dotenv").config();

function parseQuery<T>(req: Request): T {
  return querystring.parse(req.originalUrl.split("?")[1] ?? "") as T;
}

function getSingleQueryValue(
  value: string | string[] | undefined,
  fallback = ""
): string {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function encodeWaitingRoomValue(
  dbResult: unknown
): Array<ErrorResult | WaitingRoomState> {
  const value = Array.isArray(dbResult)
    ? (dbResult as Array<ErrorResult | WaitingRoomState>)
    : [];
  const firstValue = value[0];

  if (
    firstValue &&
    "password" in firstValue &&
    typeof firstValue.password === "string"
  ) {
    value[0] = Object.assign(firstValue, {
      password: encode(
        firstValue.password,
        firstValue.roomName.replace(" ", "_")
      ),
    });
  }

  return value;
}

router.get("/wait/create/", async function (
  req: Request,
  res: Response,
  _next: NextFunction
) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from

  const query = parseQuery<WaitingRoomCreateQuery>(req);

  console.log(query);

  const dbResult = await makeWaitRoom(query);

  const value = encodeWaitingRoomValue(dbResult);

  console.log("============");
  console.log(value);
  console.log("============");

  res.send(value);
});

router.get("/wait/get/", async function (
  req: Request,
  res: Response,
  _next: NextFunction
) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from

  const query = parseQuery<WaitingRoomGetQuery>(req);
  const dbResult = await getWaitRoom(query);

  const value = encodeWaitingRoomValue(dbResult);

  console.log("============");
  console.log(value);
  console.log("============");

  res.send(value);
});

router.get("/wait/join/", async function (
  req: Request,
  res: Response,
  _next: NextFunction
) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from

  const query = parseQuery<WaitingRoomJoinQuery>(req);
  const dbResult = await joinWaitRoom(query);

  const value = encodeWaitingRoomValue(dbResult);

  console.log("============");
  console.log(value);
  console.log("============");

  res.send(value);
});

router.get("/players/", async function (
  req: Request,
  res: Response,
  _next: NextFunction
) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from

  const query = parseQuery<{ room?: string | string[] }>(req);
  const room = getSingleQueryValue(query.room);

  console.log(room);

  const dbObject = await stupefyDB.getRoom(room);
  console.log(dbObject);
  // let dbObject = await getRoom(query.room).catch(console.error);
  res.send(dbObject);
});

router.get("/players/create-room/", async function (
  req: Request,
  res: Response,
  _next: NextFunction
) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from

  const query = parseQuery<{ room?: string | string[] }>(req);
  const room = getSingleQueryValue(query.room);

  console.log(room);

  const dbObject = await stupefyDB.makeRoom(room);
  console.log(dbObject);
  // let dbObject = await getRoom(query.room).catch(console.error);
  res.send(dbObject);
});

module.exports = router;
