import { readBody, setResponseHeader } from "h3";

const { updateActive } = require("../../../../utils/waitingRoomDB") as {
  updateActive(data: {
    data: {
      active: Record<string, number | string>;
      activeUpdatedAt: Record<string, number>;
    };
    room: string;
  }): Promise<unknown>;
};

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
