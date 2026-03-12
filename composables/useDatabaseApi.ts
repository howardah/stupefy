import type {
  GameRoomApiResponse,
  PlayerState,
  WaitingChatMessage,
  WaitingRoomApiResponse,
} from "~/utils/types";

export function useDatabaseApi() {
  const createRoom = (params: { player: string; pw?: string; room: string }) =>
    $fetch<WaitingRoomApiResponse>("/database/wait/create/", { params });

  const getWaitingRoom = (params: { id: number | string; key: string; room: string }) =>
    $fetch<WaitingRoomApiResponse>("/database/wait/get/", { params });

  const joinRoom = (params: { player: string; pw?: string; room: string }) =>
    $fetch<WaitingRoomApiResponse>("/database/wait/join/", { params });

  const updateActive = (body: {
    playerId: number | string;
    room: string;
    sessionId: string;
  }) =>
    $fetch<WaitingRoomApiResponse>("/database/wait/active/", {
      body,
      method: "POST",
    });

  const removeActive = (body: { room: string; sessionId: string }) =>
    $fetch<WaitingRoomApiResponse>("/database/wait/active/", {
      body,
      method: "DELETE",
    });

  const addChat = (body: { newChat: WaitingChatMessage; room: string }) =>
    $fetch<WaitingRoomApiResponse>("/database/wait/chat/", {
      body,
      method: "POST",
    });

  const startGame = (body: { players: PlayerState[]; room: string }) =>
    $fetch<GameRoomApiResponse>("/database/wait/start/", {
      body,
      method: "POST",
    });

  const getGameRoom = (params: { room: string }) =>
    $fetch<GameRoomApiResponse>("/database/players/", { params });

  return {
    addChat,
    createRoom,
    getGameRoom,
    getWaitingRoom,
    joinRoom,
    removeActive,
    startGame,
    updateActive,
  };
}
