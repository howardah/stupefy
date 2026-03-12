import { getQuery, setResponseHeader } from "h3";

const { encode } = require("../../../../utils/encrypt") as typeof import("../../../../utils/encrypt");
const { makeWaitRoom } = require("../../../../utils/waitingRoomDB") as {
  makeWaitRoom(query: { player: string; pw?: string; room: string }): Promise<unknown>;
};

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const query = getQuery(event) as {
    player: string;
    pw?: string;
    room: string;
  };

  const dbResult = await makeWaitRoom(query);
  const value = Array.isArray(dbResult) ? dbResult : [];
  const first = value[0];

  if (first && "password" in first && typeof first.password === "string") {
    value[0] = Object.assign(first, {
      password: encode(first.password, first.roomName.replace(" ", "_")),
    });
  }

  return value;
});
