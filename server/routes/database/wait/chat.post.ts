import { readBody, setResponseHeader } from "h3";
import { addChat } from "@shared/utils/waitingRoomDB";
import { broadcastToRoom } from "@server/utils/wsChannels";

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const body = (await readBody(event)) as {
    newChat: { player: number; text: string; time: number };
    room: string;
  };

  const result = await addChat(body);
  broadcastToRoom(body.room, "chat");
  return result;
});
