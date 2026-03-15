# Step 6: Wire WebSocket Notifications into the Waiting Room

## Objective

Replace the 4-second `setInterval` in `waiting-room.vue` with WebSocket-driven refreshes. Chat messages, ready status changes, and player presence updates appear instantly instead of on the next poll cycle.

## Current Waiting Room Polling

In `pages/waiting-room.vue`, the room state is refreshed via:

```typescript
refreshTimer = setInterval(() => {
  void refreshRoom();
}, 4000);
```

Each `refreshRoom()` call fetches the full waiting room state and updates the heartbeat. This is independent from the gameplay sync system — it has its own timer and its own API calls.

## Changes

### 1. Add WebSocket to `waiting-room.vue`

```typescript
// In <script setup>

const wsPullTrigger = ref(0);

const websocket = useRealtimeWebSocket({
  autoConnect: true,
  onRoomUpdated(room, source) {
    if (room === roomKey.value) {
      wsPullTrigger.value++;
    }
  },
});

// Subscribe when room key is known
watch(
  () => roomKey.value,
  (key) => {
    if (key) {
      websocket.subscribe(key);
    }
  },
  { immediate: true },
);

// React to WebSocket notifications
watch(wsPullTrigger, () => {
  void refreshRoom();
});
```

### 2. Slow Down the Fallback Poll

Change the `setInterval` from 4 seconds to 15-30 seconds:

```typescript
// Change from:
refreshTimer = setInterval(() => {
  void refreshRoom();
}, 4000);

// To:
refreshTimer = setInterval(() => {
  void refreshRoom();
}, 15_000); // Fallback only — WebSocket handles real-time
```

### 3. Clean Up on Leave

```typescript
onBeforeUnmount(() => {
  websocket.unsubscribe();
  if (refreshTimer) clearInterval(refreshTimer);
});
```

### 4. (Optional) Show Connection Status

If the waiting room UI has a status area, expose WebSocket connectivity:

```typescript
const isRealtimeConnected = computed(() => websocket.status.value === "connected");
```

Use this to show a subtle indicator (green dot, "live" badge, etc.) so players know updates are instant.

## How Specific Events Improve

### Chat Messages

**Before:** Player A sends a message → Player B sees it 0-4 seconds later.
**After:** Player A sends a message → server broadcasts `source: "chat"` → Player B's `onRoomUpdated` fires → `refreshRoom()` fetches new state → message appears in ~100-200ms.

Chat now feels like a real chat instead of a message board that refreshes.

### Ready Status

**Before:** Player A toggles ready → other players see it 0-4 seconds later.
**After:** Instant. The "Start Game" button enables the moment all players are ready, without waiting for the next poll.

### Player Join/Leave

**Before:** A new player joins → existing players discover them on the next poll.
**After:** The `POST /database/wait/active/` broadcast triggers an immediate refresh. New players appear within ~200ms.

### Game Start

**Before:** Host starts the game → other players discover it 0-4 seconds later and redirect.
**After:** `source: "start"` notification triggers immediate refresh → all players redirect to the game room simultaneously.

## Verification

1. Run `bun run dev`
2. Open two tabs in the same waiting room
3. Send a chat message from Tab A → it should appear in Tab B within ~200ms
4. Toggle ready in Tab A → Tab B should reflect it instantly
5. Disconnect WebSocket (Network tab → close WS) → confirm fallback polling still works at 15s interval
6. Reconnect → confirm instant updates resume

## Notes

- The waiting room uses a different API endpoint (`/database/wait/get/`) than gameplay (`/database/players/`), but the WebSocket notification layer doesn't care — it just tells clients "something changed in this room." The client decides what to refetch.
- The heartbeat (`updateActive`) should continue on its own timer (every 15-30s) regardless of WebSocket status. Heartbeats serve a different purpose — they're a server-side liveliness check, not a client-side state fetch.
- If the waiting room and game room share the same room key (which they do — the key is derived from the room name), a single WebSocket subscription covers both. When the player transitions from waiting room to game room, the subscription carries over if using the same composable instance, or the new page re-subscribes.
