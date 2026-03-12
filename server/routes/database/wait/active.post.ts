import { readBody, setResponseHeader } from "h3";

const { updateActive } = require("../../../../utils/waitingRoomDB") as {
  updateActive(data: {
    data: { active: Record<string, number | string> };
    room: string;
  }): Promise<unknown>;
};

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const body = (await readBody(event)) as {
    active: Record<string, number | string>;
    room: string;
  };

  return updateActive({
    room: body.room,
    data: { active: body.active },
  });
});
