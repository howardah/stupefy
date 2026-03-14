# Nuxt Modernization Plan

## Goals

1. Replace the legacy Express-hosted backend shell with Nuxt + Nitro.
2. Port the React frontend to Vue while preserving the current game rules and room flow.
3. Fix long-standing correctness issues during the migration, rather than carrying them forward.
4. Keep MongoDB as the source of truth, but clean up the data contracts and reduce implicit state.

## Current State

- The original frontend source was not present in the repository, but it has been recovered from `public/static/js/main.5a8956df.chunk.js.map` into `.recovered-react/`.
- The project now has TypeScript coverage for the backend utilities.
- The old waiting-room flow depended on Socket.IO primarily for lobby synchronization.
- The full gameplay board logic still lives only in the recovered React source.

## Migration Phases

### Phase 1: Structural Migration

- Keep `.recovered-react/` as the canonical migration reference.
- Move HTTP endpoints from Express into Nitro server routes.
- Introduce Nuxt pages for `/welcome`, `/waiting-room`, and `/play`.
- Replace the old static-file Express router with file-based Nuxt routing.
- Remove `express`, `sticky-session`, and `socket.io-redis` from runtime dependencies.

### Phase 2: Lobby Flow Port

- Port `CreateJoin`, `CreateRoom`, `JoinRoom`, and `Room` from React into Vue composables and components.
- Replace lobby Socket.IO synchronization with HTTP polling and explicit active-presence writes.
- Add server endpoints for:
  - waiting-room fetch
  - waiting-room active presence
  - waiting-room chat
  - waiting-room game start
- Normalize room query handling with route query composables.

### Phase 3: Gameplay State Model Cleanup

- Split the current broad `GameState` shape into narrower interfaces:
  - room snapshot
  - player state
  - turn-cycle state
  - event queue
  - card effect payloads
- Remove implicit mutation patterns from DB utilities.
- Replace the hand-rolled queue logic with deterministic room-level update primitives.
- Add runtime guards around persisted Mongo payloads before using them in Vue state.

### Phase 4: Gameplay UI Port

- Port `App.js` and `Board` into a page-level Vue container.
- Convert class components into composables plus presentational Vue components.
- Port the following groups in order:
  - board shell and loader
  - player/table/sidebar/action presentation
  - card rendering and click targeting
  - turn-cycle helpers
  - event resolution UI
  - card rule execution
- Preserve current gameplay semantics first, then simplify after parity is reached.

### Phase 5: Real-Time Transport Cleanup

- Decide whether the game board still needs Socket.IO after the Vue port.
- If real-time play remains required:
  - add a dedicated real-time layer that is independent of Express
  - isolate transport events behind typed server handlers
  - stop mutating view state directly from socket payloads
- If polling proves sufficient for some flows, keep those flows HTTP-only.

### Phase 6: Backend Reliability Fixes

- Remove waiting-room in-memory coordination from the old server model.
- Ensure room creation and game start are idempotent.
- Add room expiry jobs or explicit archival semantics instead of passive stale-room behavior.
- Fix collection naming inconsistencies between waiting-room and game-room storage.
- Replace deprecated Mongo collection operations with current driver usage everywhere.

### Phase 7: Product and UX Cleanup

- Add explicit loading, empty, and error states across all pages.
- Surface room/join/start errors in the UI rather than relying on console logging.
- Add a basic end-game summary and win-condition checks.
- Document unresolved card rules and missing character powers.

## Known Risks

- The board logic is large and tightly coupled to component state mutation.
- The recovered source is good enough for migration, but it still reflects the original technical debt.
- Gameplay sockets cannot be considered migrated yet; only the HTTP shell and lobby flow should be treated as actively modernized.

## Recommended Next Refactor Sequence

1. Port the `Board` container into `pages/play.vue` with parity-focused state loading.
2. Move reusable board behavior into composables:
   - `useRoomState`
   - `useTurnCycle`
   - `useCardResolution`
   - `useRealtimeRoom`
3. Port pure utility modules before porting card-rule view components.
4. Add fixture-based tests around card resolution before rewriting rule internals.
