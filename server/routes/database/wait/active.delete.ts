import { readBody, setResponseHeader } from "h3";

const { removeActiveSession } = require("../../../../utils/waitingRoomDB") as {
  removeActiveSession(data: {
    room: string;
    sessionId: string;
  }): Promise<unknown>;
};

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const body = (await readBody(event)) as {
    room: string;
    sessionId: string;
  };

  return removeActiveSession(body);
});
