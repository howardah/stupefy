import { createError, getQuery, setResponseHeader } from "h3";
import { encode } from "@shared/utils/encrypt";
import { roomPasswordKey } from "@shared/utils/room";
import { joinWaitRoom } from "@shared/utils/waitingRoomDB";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const query = getQuery(event) as {
    player: string;
    pw?: string;
    room: string;
  };

  const dbResult = await joinWaitRoom(query);

  if (!dbResult) {
    console.error("[wait/join] Waiting room join returned no result.", {
      player: query.player,
      room: query.room,
    });
    throw createError({
      statusCode: 500,
      statusMessage: "Unable to join the room.",
    });
  }

  const value = Array.isArray(dbResult) ? dbResult : [];
  const first = value[0];

  if (first && "password" in first && typeof first.password === "string") {
    value[0] = Object.assign(first, {
      password: encode(first.password, roomPasswordKey(first.roomName)),
    });
  }

  return value;
});
