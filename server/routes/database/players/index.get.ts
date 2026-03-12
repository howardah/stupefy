import { getQuery, setResponseHeader } from "h3";

const stupefyDB = require("../../../../utils/stupefyDB") as {
  getRoom(room: string): Promise<unknown>;
};

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const query = getQuery(event) as { room?: string };
  return stupefyDB.getRoom(query.room || "");
});
