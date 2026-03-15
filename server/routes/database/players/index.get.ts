import { getQuery, setResponseHeader } from "h3";
import { getRoom } from "@shared/utils/stupefyDB";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const query = getQuery(event) as { room?: string };
  return getRoom(query.room || "");
});
