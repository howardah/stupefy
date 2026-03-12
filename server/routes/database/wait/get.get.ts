import { getQuery, setResponseHeader } from "h3";

const { encode } = require("../../../../utils/encrypt") as {
  encode(message: string, key: string): string;
};
const { roomPasswordKey } = require("../../../../utils/room") as typeof import("../../../../utils/room");
const { getWaitRoom } = require("../../../../utils/waitingRoomDB") as {
  getWaitRoom(query: { id: string | number; key: string; room: string }): Promise<unknown>;
};

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const query = getQuery(event) as {
    id: string | number;
    key: string;
    room: string;
  };

  const dbResult = await getWaitRoom(query);
  const value = Array.isArray(dbResult) ? dbResult : [];
  const first = value[0];

  if (first && "password" in first && typeof first.password === "string") {
    value[0] = Object.assign(first, {
      password: encode(first.password, roomPasswordKey(first.roomName)),
    });
  }

  return value;
});
