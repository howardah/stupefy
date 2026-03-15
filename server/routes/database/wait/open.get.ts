import { setResponseHeader } from "h3";
import { listOpenWaitRooms } from "@shared/utils/waitingRoomDB";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  return listOpenWaitRooms();
});
