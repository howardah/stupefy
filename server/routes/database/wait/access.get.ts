import { getQuery, setResponseHeader } from "h3";
import { getWaitRoomAccess } from "~/utils/waitingRoomDB";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const query = getQuery(event) as { room?: string };

  return getWaitRoomAccess(query.room || "");
});
