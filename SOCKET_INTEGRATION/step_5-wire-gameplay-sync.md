# Step 5: Wire WebSocket Notifications into Gameplay Sync

## Objective

Replace the 3-second polling timer in the gameplay loop with WebSocket-driven fetches. When the server broadcasts "room-updated", the client immediately fetches the latest state through the existing HTTP endpoint. Polling remains as a fallback for missed notifications.

This is the highest-impact step — it's where players will feel the difference.

## Strategy

The change is surgical. We don't rewrite `useRealtimeRoom` or `usePlayRoomSync`. Instead:

1. `useRealtimeRoom` gets a new option: an external "pull trigger" that fires alongside (or instead of) the poll timer.
2. `usePlayRoomSync` creates the WebSocket instance and connects the "room-updated" event to `pullLatest()`.
3. The poll interval is increased from 3s to 15s (or 30s) as a safety net — it only matters if the WebSocket disconnects.

## Changes

### 1. Modify `useRealtimeRoom.ts` — Accept External Pull Triggers

Add an optional `onExternalPull` mechanism. The simplest approach: accept a `watchSource` that triggers a pull when it changes.

```typescript
// In UseRealtimeRoomOptions, add:
interface UseRealtimeRoomOptions {
  // ... existing options ...

  /**
   * A reactive counter that triggers a pull when incremented.
   * Used by WebSocket notifications to request an immediate fetch.
   */
  externalPullTrigger?: Ref<number>;

  /**
   * Poll interval when WebSocket is active (fallback only).
   * Default: same as pollIntervalMs.
   */
  fallbackPollIntervalMs?: number;
}
```

Inside the composable, watch the trigger:

```typescript
// Add after the existing polling setup:
if (options.externalPullTrigger) {
  watch(options.externalPullTrigger, (next, prev) => {
    if (next !== prev && next > 0) {
      pullLatest("push"); // "push" = triggered by server notification
    }
  });
}
```

Add `"push"` to the `pullLatest` reason type:

```typescript
// Update the reason parameter type:
function pullLatest(reason?: "connect" | "manual" | "poll" | "retry" | "push"): Promise<void>;
```

### 2. Modify `usePlayRoomSync.ts` — Create WebSocket and Connect It

```typescript
// At the top of usePlayRoomSync setup:

const wsPullTrigger = ref(0);

const websocket = useRealtimeWebSocket({
  autoConnect: true,
  onRoomUpdated(room, source) {
    // Only react to notifications for our room
    if (room === toValue(options.normalizedRoomKey)) {
      if (source === "gameplay" || source === "start") {
        // Increment trigger to cause useRealtimeRoom to pull latest state
        wsPullTrigger.value++;
      }
    }
  },
});

// Subscribe to room when room key is available
watch(
  () => toValue(options.normalizedRoomKey),
  (roomKey) => {
    if (roomKey) {
      websocket.subscribe(roomKey);
    } else {
      websocket.unsubscribe();
    }
  },
  { immediate: true },
);
```

Pass the trigger into `useRealtimeRoom`:

```typescript
const realtimeRoom = useRealtimeRoom({
  enabled: computed(() => Boolean(options.normalizedRoomKey.value && options.playerId.value > 0)),
  fetchLatest: fetchLatestRoom,
  pushUpdate: options.api.updateGameRoom,
  room: options.normalizedRoomKey,
  externalPullTrigger: wsPullTrigger,
  // Slow down polling — it's now just a fallback
  pollIntervalMs: websocket.status.value === "connected" ? 15_000 : 3_000,
});
```

### 3. Dynamic Poll Interval Based on WebSocket Status

Make the poll interval reactive to WebSocket health:

```typescript
// In useRealtimeRoom, make the interval reactive:
const effectivePollInterval = computed(() => {
  if (options.externalPullTrigger && websocket?.status.value === "connected") {
    return options.fallbackPollIntervalMs ?? 15_000;
  }
  return options.pollIntervalMs ?? 3_000;
});
```

Alternatively, if modifying the poll timer is too invasive, simply keep the 3s poll as-is for now. The WebSocket trigger will cause an immediate fetch, and the next poll will be a no-op (same signature). You can optimize the poll interval later.

### 4. Expose WebSocket Status (Optional but Useful)

Return the WebSocket status from `usePlayRoomSync` so the UI can show connection state:

```typescript
return {
  // ... existing returns ...
  wsStatus: websocket.status,
};
```

## How It Works End-to-End

```
Player A plays a card:
  1. Local state mutated optimistically
  2. mutationNonce incremented
  3. POST /database/players/update/ sent (existing flow)
  4. Server persists to MongoDB (existing flow)
  5. Server calls broadcastToRoom(room, "gameplay")     ← NEW
  6. WebSocket sends {"type":"room-updated"} to room    ← NEW
  7. Player B's onRoomUpdated fires                      ← NEW
  8. wsPullTrigger incremented                           ← NEW
  9. useRealtimeRoom.pullLatest("push") fires            ← NEW
  10. GET /database/players/ fetches latest state         (existing flow)
  11. Signature differs → authoritative state applied     (existing flow)
  12. Player B sees the card played (~100-200ms total)
```

Steps 5-9 are new. Steps 1-4 and 10-12 are unchanged.

## What About the Player Who Made the Move?

The acting player (Player A) already has the correct state locally (optimistic mutation) and gets confirmation via the HTTP response to their POST. They don't need the WebSocket notification for their own action. However, they'll receive it anyway (broadcastToRoom sends to all subscribers), and the resulting pull will be a no-op because signatures match.

## Fallback Behavior

If the WebSocket disconnects:

- `websocket.status` becomes `"disconnected"` → `"reconnecting"`
- The composable automatically attempts reconnection with exponential backoff
- Meanwhile, the polling timer continues at its configured interval (3s or 15s)
- No state changes are missed — they're just discovered on the next poll instead of instantly
- When WebSocket reconnects, it re-subscribes to the room automatically

## Verification

1. Run `bun run dev`
2. Open two browser tabs, both in the same game room
3. Player A plays a card
4. Player B should see the card appear within ~200ms (check Network tab — the GET request fires immediately after the WebSocket message, not on the 3s timer)
5. Kill the WebSocket connection (close the `_ws` tab in dev tools Network → WS)
6. Player A plays another card
7. Player B should still see it within 3-15 seconds (polling fallback)
8. WebSocket should reconnect within a few seconds, and instant updates resume

## Risk Assessment

**What could go wrong:**

- WebSocket trigger fires but HTTP fetch fails → existing retry logic in `useRealtimeRoom` handles this
- Double fetches (WebSocket trigger + poll timer fire close together) → signature comparison deduplicates, no harm, just one extra HTTP request
- WebSocket never connects (firewall, proxy issues) → polling fallback keeps everything working exactly as before

**Mitigation:**
The polling fallback means this step cannot make things worse. In the absolute worst case (WebSocket completely broken), the game behaves exactly as it does today.
