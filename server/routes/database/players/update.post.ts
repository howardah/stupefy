import { createError, readBody, setResponseHeader } from "h3";
import type { GameState } from "~/utils/types";
import { updateRoom } from "~/utils/stupefyDB";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const body = (await readBody(event)) as {
    data?: Partial<GameState>;
    room?: string;
  };

  if (!body.room || !body.data) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing game room update payload.",
    });
  }

  await updateRoom(body.room, body.data);
  return { ok: true };
});
