import { readBody, setResponseHeader } from "h3";

const { addChat } = require("../../../../utils/waitingRoomDB") as {
  addChat(data: {
    newChat: { player: number; text: string; time: number };
    room: string;
  }): Promise<unknown>;
};

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");

  const body = (await readBody(event)) as {
    newChat: { player: number; text: string; time: number };
    room: string;
  };

  return addChat(body);
});
