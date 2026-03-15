# Step 1: Enable Nitro WebSocket Support

## Objective

Turn on Nitro's experimental WebSocket support and create a minimal WebSocket endpoint that accepts connections. No client changes — this step just proves the server can handle WebSocket upgrades.

## Why First

Everything else depends on the server accepting WebSocket connections. This is the smallest possible change and is completely inert until clients connect.

## Changes

### 1. Update `nuxt.config.ts`

Add the `nitro.experimental.websocket` flag:

```typescript
export default defineNuxtConfig({
  compatibilityDate: "2026-03-12",
  css: ["~/assets/css/main.css"],
  devtools: { enabled: true },
  modules: ["@nuxt/ui"],
  nitro: {
    experimental: {
      websocket: true,
    },
  },
  srcDir: ".",
});
```

This tells Nitro (via crossws/h3) to handle WebSocket upgrade requests on routes that export a WebSocket handler.

### 2. Create `server/routes/_ws.ts`

This is the WebSocket endpoint. The `_ws` prefix is a convention — clients will connect to `ws://localhost:3000/_ws`. Nitro's `defineWebSocketHandler` provides the hook points.

```typescript
// server/routes/_ws.ts
export default defineWebSocketHandler({
  open(peer) {
    console.log(`[ws] connected: ${peer.id}`);
  },

  message(peer, message) {
    const text = typeof message === "string" ? message : message.text();
    console.log(`[ws] message from ${peer.id}: ${text}`);

    // Echo back for now — replaced in Step 2 with real handling
    peer.send(JSON.stringify({ type: "pong" }));
  },

  close(peer, event) {
    console.log(`[ws] disconnected: ${peer.id} (code: ${event.code})`);
  },

  error(peer, error) {
    console.error(`[ws] error for ${peer.id}:`, error);
  },
});
```

## Verification

1. Run `bun run dev`
2. Open browser dev tools console
3. Test the connection:

```javascript
const ws = new WebSocket("ws://localhost:3000/_ws");
ws.onopen = () => {
  console.log("connected");
  ws.send(JSON.stringify({ type: "ping" }));
};
ws.onmessage = (e) => console.log("received:", e.data);
ws.onclose = (e) => console.log("closed:", e.code);
```

4. You should see:
   - Console: `connected`
   - Console: `received: {"type":"pong"}`
   - Server logs: `[ws] connected: <peer-id>` and `[ws] message from <peer-id>: {"type":"ping"}`

5. Confirm the rest of the application still works normally — all HTTP routes, polling, gameplay unchanged.

## Notes

- The `_ws` route name is arbitrary. We use an underscore prefix to signal it's infrastructure, not a page route.
- Nitro's `defineWebSocketHandler` uses [crossws](https://github.com/unjs/crossws) under the hood, which provides a unified WebSocket API across runtimes (Bun, Node, Deno, Cloudflare).
- The `peer` object has `.id`, `.send()`, `.close()`, and can be used with `peer.subscribe(channel)` / `peer.publish(channel, message)` for pub/sub — which we'll use in Step 2.
- No need to install any packages. This is built into Nitro.
