import type { WsClientMessage, WsServerMessage, WsNotificationSource } from "@shared/utils/types";

interface UseRealtimeWebSocketOptions {
  /** Automatically connect on creation. Default: true. */
  autoConnect?: boolean;
  /** Callback when the server pushes a room-updated notification. */
  onRoomUpdated?: (room: string, source: WsNotificationSource | undefined) => void;
}

type WsStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

/**
 * Manages a single WebSocket connection to the Nitro _ws endpoint.
 * Handles room subscriptions, keepalive pings, and automatic reconnection.
 */
export function useRealtimeWebSocket(options: UseRealtimeWebSocketOptions = {}) {
  const { autoConnect = true, onRoomUpdated } = options;

  const status = ref<WsStatus>("disconnected");
  const subscribedRoom = ref<string | null>(null);

  let ws: WebSocket | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;

  const MAX_RECONNECT_DELAY = 10_000;
  const BASE_RECONNECT_DELAY = 500;
  const PING_INTERVAL = 30_000;

  function getWsUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/_ws`;
  }

  function sendMessage(msg: WsClientMessage): void {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function handleServerMessage(msg: WsServerMessage): void {
    switch (msg.type) {
      case "room-updated":
        if (msg.room && onRoomUpdated) {
          onRoomUpdated(msg.room, msg.source);
        }
        break;
      case "pong":
      case "subscribed":
      case "unsubscribed":
        break;
      case "error":
        console.warn(`[ws] server error: ${msg.message}`);
        break;
    }
  }

  // ── Connection lifecycle ──────────────────────────────────────────

  function connect(): void {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    status.value = reconnectAttempts > 0 ? "reconnecting" : "connecting";
    ws = new WebSocket(getWsUrl());

    ws.onopen = () => {
      status.value = "connected";
      reconnectAttempts = 0;
      startPing();

      // Re-subscribe if we were subscribed before reconnect
      if (subscribedRoom.value) {
        sendMessage({ type: "subscribe", room: subscribedRoom.value });
      }
    };

    ws.onmessage = (event) => {
      try {
        handleServerMessage(JSON.parse(event.data));
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      status.value = "disconnected";
      stopPing();
      scheduleReconnect();
    };

    ws.onerror = () => {
      // onclose fires after onerror — reconnect logic lives there
    };
  }

  function disconnect(): void {
    clearReconnectTimer();
    stopPing();

    if (ws) {
      ws.onclose = null; // Prevent reconnect on intentional close
      ws.close();
      ws = null;
    }

    status.value = "disconnected";
    subscribedRoom.value = null;
  }

  // ── Room subscription ─────────────────────────────────────────────

  function subscribe(room: string): void {
    subscribedRoom.value = room;
    sendMessage({ type: "subscribe", room });
  }

  function unsubscribe(): void {
    if (subscribedRoom.value) {
      sendMessage({ type: "unsubscribe", room: subscribedRoom.value });
      subscribedRoom.value = null;
    }
  }

  // ── Keepalive ─────────────────────────────────────────────────────

  function startPing(): void {
    stopPing();
    pingTimer = setInterval(() => {
      sendMessage({ type: "ping" });
    }, PING_INTERVAL);
  }

  function stopPing(): void {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  }

  // ── Reconnection ──────────────────────────────────────────────────

  function scheduleReconnect(): void {
    clearReconnectTimer();
    const delay = Math.min(BASE_RECONNECT_DELAY * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY);
    reconnectAttempts++;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  function clearReconnectTimer(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────

  if (autoConnect && import.meta.client) {
    connect();
  }

  onBeforeUnmount(() => {
    disconnect();
  });

  return {
    status: readonly(status),
    subscribedRoom: readonly(subscribedRoom),
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}
