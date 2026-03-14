import { getQuery, setResponseHeader } from "h3";
import { makeRoom } from "~/utils/stupefyDB";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const query = getQuery(event) as { room?: string };
  return makeRoom(query.room || "");
});
