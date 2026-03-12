import type {
  GameRoomApiResponse,
  OpenWaitingRoomSummary,
  WaitingChatMessage,
  WaitingRoomApiResponse,
} from "~/utils/types";

export function useDatabaseApi() {
  async function request<T>(path: string, options?: Parameters<typeof $fetch<T>>[1]) {
    try {
      return await $fetch<T>(path, options);
    } catch (error) {
      console.error(`[useDatabaseApi] Request failed: ${path}`, error);
      throw error;
    }
  }

  const createRoom = (params: { player: string; pw?: string; room: string }) =>
    request<WaitingRoomApiResponse>("/database/wait/create/", { params });

  const getWaitingRoom = (params: { id: number | string; key: string; room: string }) =>
    request<WaitingRoomApiResponse>("/database/wait/get/", { params });

  const joinRoom = (params: { player: string; pw?: string; room: string }) =>
    request<WaitingRoomApiResponse>("/database/wait/join/", { params });

  const getOpenRooms = () =>
    request<OpenWaitingRoomSummary[]>("/database/wait/open/");

  const updateActive = (body: {
    playerId: number | string;
    room: string;
    sessionId: string;
  }) =>
    request<WaitingRoomApiResponse>("/database/wait/active/", {
      body,
      method: "POST",
    });

  const removeActive = (body: { room: string; sessionId: string }) =>
    request<WaitingRoomApiResponse>("/database/wait/active/", {
      body,
      method: "DELETE",
    });

  const addChat = (body: { newChat: WaitingChatMessage; room: string }) =>
    request<WaitingRoomApiResponse>("/database/wait/chat/", {
      body,
      method: "POST",
    });

  const setReady = (body: {
    playerId: number | string;
    ready: boolean;
    room: string;
  }) =>
    request<WaitingRoomApiResponse>("/database/wait/ready/", {
      body,
      method: "POST",
    });

  const startGame = (body: { room: string }) =>
    request<GameRoomApiResponse>("/database/wait/start/", {
      body,
      method: "POST",
    });

  const getGameRoom = (params: { room: string }) =>
    request<GameRoomApiResponse>("/database/players/", { params });

  return {
    addChat,
    createRoom,
    getGameRoom,
    getOpenRooms,
    getWaitingRoom,
    joinRoom,
    removeActive,
    setReady,
    startGame,
    updateActive,
  };
}
