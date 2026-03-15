import type { Peer } from "crossws";
import type { WsClientMessage, WsNotificationSource, WsServerMessage } from "@shared/utils/types";

/** Track which channels a peer is subscribed to, for cleanup on disconnect. */
const peerRooms = new Map<string, Set<string>>();

/** Active peers for broadcasting from HTTP routes. */
const activePeers = new Set<Peer>();

function roomChannel(room: string): string {
  return `room:${room}`;
}

function send(peer: Peer, msg: WsServerMessage): void {
  peer.send(JSON.stringify(msg));
}

/** Handle an incoming WebSocket message from a peer. */
export function handleWsMessage(peer: Peer, raw: string): void {
  let msg: WsClientMessage;
  try {
    msg = JSON.parse(raw);
  } catch {
    send(peer, { type: "error", message: "Invalid JSON" });
    return;
  }

  switch (msg.type) {
    case "subscribe": {
      if (!msg.room) {
        send(peer, { type: "error", message: "Missing room" });
        return;
      }
      const channel = roomChannel(msg.room);
      peer.subscribe(channel);

      if (!peerRooms.has(peer.id)) {
        peerRooms.set(peer.id, new Set());
      }
      peerRooms.get(peer.id)!.add(channel);

      send(peer, { type: "subscribed", room: msg.room });
      break;
    }

    case "unsubscribe": {
      if (!msg.room) return;
      const channel = roomChannel(msg.room);
      peer.unsubscribe(channel);
      peerRooms.get(peer.id)?.delete(channel);
      send(peer, { type: "unsubscribed", room: msg.room });
      break;
    }

    case "ping": {
      send(peer, { type: "pong" });
      break;
    }

    default: {
      send(peer, { type: "error", message: `Unknown message type` });
    }
  }
}

/** Clean up all subscriptions for a peer on disconnect. */
export function cleanupPeer(peer: Peer): void {
  const rooms = peerRooms.get(peer.id);
  if (rooms) {
    for (const channel of rooms) {
      peer.unsubscribe(channel);
    }
    peerRooms.delete(peer.id);
  }
}

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
export function broadcastToRoom(room: string, source: WsNotificationSource): void {
  const channel = roomChannel(room);
  const payload = JSON.stringify({ type: "room-updated", room, source } satisfies WsServerMessage);

  for (const peer of activePeers) {
    // publish sends to all channel subscribers except the sender
    peer.publish(channel, payload);
    // Also send to the publishing peer if they're in this channel
    if (peerRooms.get(peer.id)?.has(channel)) {
      peer.send(payload);
    }
    break; // Only need one peer to publish
  }
}
