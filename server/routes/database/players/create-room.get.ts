import { getQuery, setResponseHeader } from "h3";

const stupefyDB = require("../../../../utils/stupefyDB") as {
  makeRoom(room: string): Promise<unknown>;
};

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const query = getQuery(event) as { room?: string };
  return stupefyDB.makeRoom(query.room || "");
});
