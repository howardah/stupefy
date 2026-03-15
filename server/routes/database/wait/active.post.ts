import { readBody, setResponseHeader } from "h3";
import { updateActive } from "@shared/utils/waitingRoomDB";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const body = (await readBody(event)) as {
    playerId: number | string;
    room: string;
    sessionId: string;
  };

  return updateActive({
    room: body.room,
    data: {
      active: { [body.sessionId]: body.playerId },
      activeUpdatedAt: { [body.sessionId]: Date.now() },
    },
  });
});
