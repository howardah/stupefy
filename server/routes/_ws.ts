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
