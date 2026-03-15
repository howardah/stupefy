# Step 4: Build the Client WebSocket Composable

## Objective

Create a Vue composable that manages a single WebSocket connection per client, handles room subscriptions, reconnection, and exposes an event-driven API that other composables can hook into. This step builds the client infrastructure — it's not wired into gameplay or the waiting room yet.

## Changes

### 1. Extend Types — `utils/types.ts`

Add WebSocket message types and extend the transport strategy:

```typescript
// Add to existing types

export type RealtimeTransportStrategy = "polling" | "websocket";

/** Messages the client sends to the server. */
export interface WsClientMessage {
  type: "subscribe" | "unsubscribe" | "ping";
  room?: string;
  playerId?: number;
}

/** Messages the server sends to the client. */
export interface WsServerMessage {
  type:
    | "room-updated"
    | "player-joined"
    | "player-left"
    | "pong"
    | "error"
    | "subscribed"
    | "unsubscribed";
  room?: string;
  source?: "gameplay" | "chat" | "presence" | "ready" | "start";
  playerId?: number;
  message?: string;
}
```

### 2. Create `composables/gameplay/useRealtimeWebSocket.ts`

```typescript
// composables/gameplay/useRealtimeWebSocket.ts

import type { WsClientMessage, WsServerMessage } from "~/utils/types";

interface UseRealtimeWebSocketOptions {
  /**
   * Automatically connect on creation. Default: true.
   */
  autoConnect?: boolean;
  /**
   * Callback when the server pushes a room-updated notification.
   */
  onRoomUpdated?: (room: string, source: WsServerMessage["source"]) => void;
}

type WsStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

/**
 * Manages a single WebSocket connection to the Nitro _ws endpoint.
 * Handles room subscriptions, keepalive pings, and automatic reconnection.
 *
 * Designed to be used as a singleton — call once at the app/page level
 * and pass the returned API to child composables.
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

  // ── Connection lifecycle ──────────────────────────────────────────

  function getWsUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/_ws`;
  }

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

      // Re-subscribe to room if we were subscribed before reconnect
      if (subscribedRoom.value) {
        sendMessage({ type: "subscribe", room: subscribedRoom.value });
      }
    };

    ws.onmessage = (event) => {
      let msg: WsServerMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      handleServerMessage(msg);
    };

    ws.onclose = () => {
      status.value = "disconnected";
      stopPing();
      scheduleReconnect();
    };

    ws.onerror = () => {
      // onclose will fire after onerror — reconnect logic lives there
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

  // ── Messaging ─────────────────────────────────────────────────────

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

      case "subscribed":
        // Confirmation — room subscription is active
        break;

      case "unsubscribed":
        break;

      case "pong":
        // Keepalive acknowledged
        break;

      case "error":
        console.warn(`[ws] server error: ${msg.message}`);
        break;
    }
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
    /** Current connection status. */
    status: readonly(status),

    /** The room this client is subscribed to, if any. */
    subscribedRoom: readonly(subscribedRoom),

    /** Connect to the WebSocket server. */
    connect,

    /** Disconnect and stop reconnection attempts. */
    disconnect,

    /** Subscribe to notifications for a room. */
    subscribe,

    /** Unsubscribe from the current room. */
    unsubscribe,
  };
}
```

## Usage Preview

This is how it will be used in Steps 5 and 6 (don't wire this up yet):

```typescript
// In a page or parent composable:
const ws = useRealtimeWebSocket({
  onRoomUpdated(room, source) {
    if (source === "gameplay") {
      // Trigger a fetch of latest game state via existing HTTP endpoint
      realtimeRoom.pullLatest("push");
    }
    if (source === "chat") {
      // Refresh chat messages
      refreshChat();
    }
  },
});

// When joining a room:
ws.subscribe(normalizedRoomKey.value);

// When leaving:
ws.unsubscribe();
```

## Verification

1. Run `bun run dev`
2. Temporarily add this to any page (e.g., `app.vue`) for testing:

```typescript
const ws = useRealtimeWebSocket({
  onRoomUpdated(room, source) {
    console.log(`Room ${room} updated via ${source}`);
  },
});

onMounted(() => {
  ws.subscribe("test-room");
});
```

3. From another browser tab, trigger a game action in "test-room"
4. The first tab should log: `Room test-room updated via gameplay`
5. Kill the dev server and restart — the client should automatically reconnect
6. Remove the test code when done

## Design Decisions

**Single connection per client, not per room.**
A player is only ever in one room at a time. One WebSocket connection with room-level subscriptions is simpler and cheaper than connection-per-room.

**`onRoomUpdated` callback instead of an event emitter.**
Keeps the API simple and avoids introducing an event system. The composable that creates the WebSocket instance passes its handler directly. If multiple listeners are needed in the future, this can be expanded.

**Reconnection with exponential backoff.**
Starts at 500ms, doubles each attempt, caps at 10 seconds. On successful reconnect, re-subscribes to the room automatically. This mirrors the resilience already built into the polling system.

**30-second ping interval.**
Keeps the connection alive through proxies and load balancers that might close idle connections. Lightweight — just `{"type":"ping"}` every 30s.

**`import.meta.client` guard.**
Prevents the WebSocket from being created during SSR. The composable is client-only by nature.
