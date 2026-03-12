import { readBody, setResponseHeader } from "h3";
import type { PlayerState } from "~/utils/types";
import { newRoom } from "~/utils/new-room";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const body = (await readBody(event)) as {
    players: PlayerState[];
    room: string;
  };

  return newRoom(body);
});
