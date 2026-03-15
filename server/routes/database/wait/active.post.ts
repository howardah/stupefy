import { readBody, setResponseHeader } from "h3";
import { updateActive } from "@shared/utils/waitingRoomDB";
import { broadcastToRoom } from "@server/utils/wsChannels";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const body = (await readBody(event)) as {
    playerId: number | string;
    room: string;
    sessionId: string;
  };

  const result = await updateActive({
    room: body.room,
    data: {
      active: { [body.sessionId]: body.playerId },
      activeUpdatedAt: { [body.sessionId]: Date.now() },
    },
  });

  broadcastToRoom(body.room, "presence");

  return result;
});
