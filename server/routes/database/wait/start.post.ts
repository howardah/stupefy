import { readBody, setResponseHeader } from "h3";

const { newRoom } = require("../../../../utils/new-room") as {
  newRoom(data: { players: unknown[]; room: string }): Promise<unknown>;
};

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const body = (await readBody(event)) as {
    players: unknown[];
    room: string;
  };

  return newRoom(body);
});
