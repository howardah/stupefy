# Step 2: Build the Server-Side Room Channel Manager

## Objective

Create a pub/sub system where WebSocket peers subscribe to room-specific channels. When a room's state changes (Step 3), we broadcast a notification to all peers in that room. This step builds the infrastructure — nothing broadcasts yet.

## Why This Design

Nitro's crossws `peer` object has built-in pub/sub via `peer.subscribe(channel)` and `peer.publish(channel, message)`. We leverage this directly instead of building our own connection tracking. The channel name is simply the room key.

## Changes

### 1. Create `server/utils/wsChannels.ts`

This module handles message parsing, room subscriptions, and provides a `broadcastToRoom` helper for server routes to call.

```typescript
// server/utils/wsChannels.ts

import type { Peer } from "crossws";

/**
 * Message types sent by the client.
 */
interface WsClientMessage {
  type: "subscribe" | "unsubscribe" | "ping";
  room?: string;
  playerId?: number;
}

/**
 * Message types sent by the server.
 */
export interface WsServerMessage {
  type: "room-updated" | "player-joined" | "player-left" | "pong" | "error" | "subscribed" | "unsubscribed";
  room?: string;
  source?: "gameplay" | "chat" | "presence" | "ready" | "start";
  playerId?: number;
  message?: string;
}

/**
 * Track which rooms a peer is subscribed to, for cleanup on disconnect.
 */
const peerRooms = new Map<string, Set<string>>();

/**
 * Format a room key into a channel name.
 */
function roomChannel(room: string): string {
  return `room:${room}`;
}

/**
 * Handle an incoming WebSocket message from a peer.
 */
export function handleWsMessage(peer: Peer, raw: string): void {
  let msg: WsClientMessage;
  try {
    msg = JSON.parse(raw);
  } catch {
    peer.send(JSON.stringify({ type: "error", message: "Invalid JSON" } satisfies WsServerMessage));
    return;
  }

  switch (msg.type) {
    case "subscribe": {
      if (!msg.room) {
        peer.send(JSON.stringify({ type: "error", message: "Missing room" } satisfies WsServerMessage));
        return;
      }
      const channel = roomChannel(msg.room);
      peer.subscribe(channel);

      // Track for cleanup
      if (!peerRooms.has(peer.id)) {
        peerRooms.set(peer.id, new Set());
      }
      peerRooms.get(peer.id)!.add(channel);

      peer.send(JSON.stringify({ type: "subscribed", room: msg.room } satisfies WsServerMessage));
      console.log(`[ws] peer ${peer.id} subscribed to ${channel}`);
      break;
    }

    case "unsubscribe": {
      if (!msg.room) return;
      const channel = roomChannel(msg.room);
      peer.unsubscribe(channel);
      peerRooms.get(peer.id)?.delete(channel);

      peer.send(JSON.stringify({ type: "unsubscribed", room: msg.room } satisfies WsServerMessage));
      console.log(`[ws] peer ${peer.id} unsubscribed from ${channel}`);
      break;
    }

    case "ping": {
      peer.send(JSON.stringify({ type: "pong" } satisfies WsServerMessage));
      break;
    }

    default: {
      peer.send(JSON.stringify({ type: "error", message: `Unknown type: ${msg.type}` } satisfies WsServerMessage));
    }
  }
}

/**
 * Clean up all subscriptions for a peer on disconnect.
 */
export function cleanupPeer(peer: Peer): void {
  const rooms = peerRooms.get(peer.id);
  if (rooms) {
    for (const channel of rooms) {
      peer.unsubscribe(channel);
    }
    peerRooms.delete(peer.id);
  }
}

/**
 * Broadcast a notification to all peers subscribed to a room.
 * Called from server routes after a successful state mutation.
 *
 * Uses peer.publish() which sends to all subscribers EXCEPT the publishing peer.
 * Since we call this from an HTTP route (not a peer), we need a reference peer.
 * Instead, we store a set of active peers and use any one to publish.
 */
const activePeers = new Set<Peer>();

export function registerPeer(peer: Peer): void {
  activePeers.add(peer);
}

export function unregisterPeer(peer: Peer): void {
  activePeers.delete(peer);
}

/**
 * Broadcast a room-updated notification to all WebSocket clients in a room.
 * Safe to call even if no peers are connected (no-op).
 */
export function broadcastToRoom(room: string, source: WsServerMessage["source"]): void {
  const channel = roomChannel(room);
  const payload = JSON.stringify({ type: "room-updated", room, source } satisfies WsServerMessage);

  // Use any active peer to publish to the channel.
  // peer.publish sends to all channel subscribers except the sender,
  // so we also need to send to the publishing peer explicitly.
  for (const peer of activePeers) {
    peer.publish(channel, payload);
    // Also send to the publishing peer if they're in this channel
    // (publish excludes the sender)
    if (peerRooms.get(peer.id)?.has(channel)) {
      peer.send(payload);
    }
    break; // Only need one peer to publish
  }
}
```

### 2. Update `server/routes/_ws.ts`

Wire the handler into the channel manager:

```typescript
// server/routes/_ws.ts
import { cleanupPeer, handleWsMessage, registerPeer, unregisterPeer } from "~/server/utils/wsChannels";

export default defineWebSocketHandler({
  open(peer) {
    registerPeer(peer);
    console.log(`[ws] connected: ${peer.id}`);
  },

  message(peer, message) {
    const text = typeof message === "string" ? message : message.text();
    handleWsMessage(peer, text);
  },

  close(peer, event) {
    cleanupPeer(peer);
    unregisterPeer(peer);
    console.log(`[ws] disconnected: ${peer.id} (code: ${event.code})`);
  },

  error(peer, error) {
    console.error(`[ws] error for ${peer.id}:`, error);
  },
});
```

## Verification

1. Run `bun run dev`
2. Open two browser tabs. In each console:

```javascript
const ws = new WebSocket("ws://localhost:3000/_ws");
ws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", room: "test-room" }));
ws.onmessage = (e) => console.log("received:", JSON.parse(e.data));
```

3. Both should log: `received: { type: "subscribed", room: "test-room" }`
4. Server logs should show both peers subscribing to `room:test-room`
5. Application still works normally — no gameplay changes.

## Design Decisions

**Why crossws pub/sub instead of manual connection tracking?**
crossws handles the fan-out efficiently at the runtime level. We don't need to maintain a `Map<room, Set<WebSocket>>` ourselves — the channel abstraction does this internally.

**Why a separate `broadcastToRoom` function?**
Server routes (HTTP handlers) don't have access to a `peer` object. `broadcastToRoom` bridges the gap by using any registered peer to publish to a channel. This is a common pattern when mixing HTTP and WebSocket in the same server.

**Why track `peerRooms`?**
So we can clean up subscriptions when a peer disconnects unexpectedly. Without this, channels would accumulate stale subscriptions.

## Notes

- `server/utils/` files are auto-imported by Nitro, so `broadcastToRoom` will be available in all server routes without explicit imports.
- The `activePeers` set is in-memory and specific to a single server instance. For multi-instance deployments, you'd need a Redis pub/sub bridge — but that's a future concern, not a blocker for this step.
