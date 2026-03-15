import { readBody, setResponseHeader } from "h3";
import { updateReadyStatus } from "@shared/utils/waitingRoomDB";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const body = (await readBody(event)) as {
    playerId: number | string;
    ready: boolean;
    room: string;
  };

  return updateReadyStatus(body);
});
