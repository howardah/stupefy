# Realtime Strategy

## Current Recommendation

Use a split transport model during the migration:

- Keep the waiting-room flow HTTP-first with polling and explicit writes.
- Restore realtime transport only for the gameplay room while the board is ported.

## Why

The recovered `Board` implementation is strongly event-driven:

- gameplay state is emitted incrementally
- pause/resume is room-broadcast based
- turn actions expect other clients to receive state updates immediately

Trying to force the gameplay room onto polling during the board port would create two problems at once:

1. a React-to-Vue migration
2. a realtime-to-polling architecture rewrite

That is the wrong sequencing for this codebase.

## Recommended Implementation Order

### 1. Keep lobby HTTP-only

The waiting-room flow can tolerate:

- periodic refresh
- eventual consistency for chat
- explicit active-presence updates

This is already good enough for the migration stage.

### 2. Reintroduce gameplay realtime separately

For the game board, use Socket.IO again, but do not bring back Express.

Preferred direction:

- standalone Socket.IO server attached to the Nuxt deployment runtime
- typed event contract in shared TypeScript modules
- no direct UI mutation from raw socket payloads

## Event Contract to Define

- `join-room`
- `stupefy`
- `pause-room`
- `resume-room`
- `room-state`
- `room-error`

## Guardrails

- Socket payloads should be validated before committing them into Vue state.
- MongoDB remains the source of truth for room snapshots.
- The UI should derive view state from normalized room snapshots, not arbitrary partial payloads.

## Deferred Work

- waiting-room websocket parity
- reconnect/backoff policy
- multi-instance coordination
- Redis adapter or equivalent fan-out layer

## Decision Summary

Short term:

- waiting room: polling
- gameplay room: Socket.IO

Long term:

- keep whichever transport proves simplest after the board port is stable, but do not rewrite the gameplay transport until parity exists in Vue.
