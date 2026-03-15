import {
  cleanupPeer,
  handleWsMessage,
  registerPeer,
  unregisterPeer,
} from "@server/utils/wsChannels";

export default defineWebSocketHandler({
  open(peer) {
    registerPeer(peer);
  },

  message(peer, message) {
    const text = typeof message === "string" ? message : message.text();
    handleWsMessage(peer, text);
  },

  close(peer) {
    cleanupPeer(peer);
    unregisterPeer(peer);
  },

  error(peer, error) {
    console.error(`[ws] error for ${peer.id}:`, error);
  },
});
