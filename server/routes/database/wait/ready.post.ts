import { readBody, setResponseHeader } from "h3";
import { updateReadyStatus } from "@shared/utils/waitingRoomDB";
import { broadcastToRoom } from "@server/utils/wsChannels";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const body = (await readBody(event)) as {
    playerId: number | string;
    ready: boolean;
    room: string;
  };

  const result = await updateReadyStatus(body);
  broadcastToRoom(body.room, "ready");
  return result;
});
