import { createError, readBody, setResponseHeader } from "h3";
import { startWaitRoomGame } from "@shared/utils/waitingRoomDB";
import { broadcastToRoom } from "@server/utils/wsChannels";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const body = (await readBody(event)) as {
    room: string;
  };

  const result = await startWaitRoomGame(body.room);

  if (!result) {
    throw createError({
      statusCode: 409,
      statusMessage: "The game cannot start until every player in the waiting room is ready.",
    });
  }

  broadcastToRoom(body.room, "start");

  return result;
});
