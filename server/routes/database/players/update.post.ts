import { createError, readBody, setResponseHeader } from "h3";
import type { GameRoomSyncRequest } from "~/utils/types";
import { updateRoom } from "~/utils/stupefyDB";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const body = (await readBody(event)) as Partial<GameRoomSyncRequest>;

  if (!body.room || !body.data || typeof body.playerId !== "number") {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing game room update payload.",
    });
  }

  const result = await updateRoom(body.room, body.data, body.expectedLastUpdated);

  if (result.conflict) {
    throw createError({
      statusCode: 409,
      statusMessage: "The room changed before your update could be applied.",
      data: result,
    });
  }

  return result;
});
