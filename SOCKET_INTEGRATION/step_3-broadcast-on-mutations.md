# Step 3: Broadcast Notifications on State Mutations

## Objective

Add a single line to each server route that mutates room state: `broadcastToRoom(room, source)`. After this step, the server is actively pushing notifications to any connected WebSocket clients. Since no client is listening yet, this is a no-op in practice — but it completes the server side of the integration.

## Changes

### 1. Gameplay State Update — `server/routes/database/players/update.post.ts`

After the successful update (before the return), broadcast to the room:

```typescript
// After: const result = await updateRoom(body.room, body.data, body.expectedLastUpdated);
// After: conflict check and error throw
// Before: return result;

broadcastToRoom(body.room, "gameplay");

return result;
```

**Important**: Broadcast on success only, not on conflict (409). The conflicting client will get the authoritative state in the HTTP response — they don't need a WebSocket ping too.

### 2. Chat Message — `server/routes/database/wait/chat.post.ts`

After the chat message is persisted:

```typescript
// After successful chat write
broadcastToRoom(body.room, "chat");
```

### 3. Ready Status — `server/routes/database/wait/ready.post.ts`

After toggling ready state:

```typescript
// After successful ready toggle
broadcastToRoom(body.room, "ready");
```

### 4. Presence Heartbeat — `server/routes/database/wait/active.post.ts`

After updating the active players map:

```typescript
// After successful presence update
broadcastToRoom(body.room, "presence");
```

### 5. Game Start — `server/routes/database/wait/start.post.ts`

After the game is initialized and the waiting room transitions:

```typescript
// After successful game start
broadcastToRoom(body.room, "start");
```

## Pattern

Every mutation endpoint follows the same pattern:

```typescript
// 1. Validate input
// 2. Perform database write
// 3. Handle errors
// 4. Broadcast notification  <-- NEW (one line)
// 5. Return HTTP response    <-- UNCHANGED
```

The `broadcastToRoom` call is fire-and-forget. It doesn't await anything, doesn't affect the HTTP response, and silently no-ops if no peers are connected. There is zero risk to existing functionality.

## Verification

1. Run `bun run dev`
2. Open a browser console and connect a WebSocket to a room:

```javascript
const ws = new WebSocket("ws://localhost:3000/_ws");
ws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", room: "your-room-key" }));
ws.onmessage = (e) => console.log("WS:", JSON.parse(e.data));
```

3. In another tab, play the game normally (or use the waiting room).
4. When actions happen, the WebSocket tab should log messages like:

```
WS: { type: "room-updated", room: "your-room-key", source: "gameplay" }
WS: { type: "room-updated", room: "your-room-key", source: "chat" }
WS: { type: "room-updated", room: "your-room-key", source: "ready" }
```

5. Confirm the game still works identically — polling, optimistic locking, conflict resolution all unchanged.

## Notes

- The `room` parameter in `broadcastToRoom` must match the room key that clients subscribe to. For gameplay routes this is `body.room`. For waiting room routes, use the same normalized room key.
- The `source` field tells the client *what* changed so it can be smart about what to refetch. A "chat" notification doesn't need to trigger a full game state fetch — just a chat refresh.
- If a route has multiple mutation paths (e.g., start game creates the game room AND archives the waiting room), broadcast once at the end, not for each sub-operation.
