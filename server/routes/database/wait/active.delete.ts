import { readBody, setResponseHeader } from "h3";
import { removeActiveSession } from "~/utils/waitingRoomDB";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const body = (await readBody(event)) as {
    room: string;
    sessionId: string;
  };

  return removeActiveSession(body);
});
