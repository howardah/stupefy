# Refactor Roadmap

This roadmap tracks the full migration from the legacy React/Express application to a modern Nuxt/Vue/Nitro application. Completed foundation work is already checked off.

## Phase 0: Baseline and Recovery

- [x] Audit the existing backend utilities and make the current TypeScript code compile under `strict` mode.
- [x] Centralize shared backend/domain types in [`utils/types.ts`](/Users/innocentsmith/Sites/node/stupefy/utils/types.ts).
- [x] Recover the original frontend source from `public/static/js/main.5a8956df.chunk.js.map` into [`.recovered-react/`](/Users/innocentsmith/Sites/node/stupefy/.recovered-react).
- [x] Preserve the recovered React source as the migration reference instead of reverse-engineering the production bundle.
- [x] Document the broad migration strategy in [`docs/nuxt-migration-plan.md`](/Users/innocentsmith/Sites/node/stupefy/docs/nuxt-migration-plan.md).

## Phase 1: Project Structure Migration

- [x] Add a Nuxt application shell with [`nuxt.config.ts`](/Users/innocentsmith/Sites/node/stupefy/nuxt.config.ts), [`app.vue`](/Users/innocentsmith/Sites/node/stupefy/app.vue), [`app.config.ts`](/Users/innocentsmith/Sites/node/stupefy/app.config.ts), and shared styles in [`assets/css/main.css`](/Users/innocentsmith/Sites/node/stupefy/assets/css/main.css).
- [x] Update [`package.json`](/Users/innocentsmith/Sites/node/stupefy/package.json) to use Nuxt scripts instead of the old Express entrypoint.
- [x] Remove Express from the intended runtime architecture and replace page serving with Nuxt file-based routing.
- [x] Introduce first-pass Nuxt pages for `/`, `/welcome`, `/waiting-room`, and `/play`.
- [x] Introduce initial Vue UI components for the migrated flows in [`components/`](/Users/innocentsmith/Sites/node/stupefy/components).

## Phase 2: HTTP Backend Migration to Nitro

- [x] Move the old `/database` HTTP routes into Nitro handlers under [`server/routes/database/`](/Users/innocentsmith/Sites/node/stupefy/server/routes/database).
- [x] Keep existing Mongo utility modules as the server-side implementation during the migration.
- [x] Add Nitro endpoints for waiting-room create/get/join.
- [x] Add Nitro endpoints for waiting-room active presence, waiting-room chat, and game start.
- [x] Add Nitro endpoints for game-room fetch and room creation.
- [x] Remove obsolete backend files that are no longer part of the Nuxt runtime:
  - [`server.ts`](/Users/innocentsmith/Sites/node/stupefy/server.ts)
  - [`routes/index.ts`](/Users/innocentsmith/Sites/node/stupefy/routes/index.ts)
  - [`routes/database.ts`](/Users/innocentsmith/Sites/node/stupefy/routes/database.ts)
- [x] Remove legacy ambient type shims that were only needed for the Express transition if they become unused.

## Phase 3: Lobby Flow Completion

- [x] Port the welcome/create/join screens into Vue components.
- [x] Port the waiting-room screen into Vue using polling and Nitro endpoints.
- [x] Add a frontend API wrapper in [`composables/useDatabaseApi.ts`](/Users/innocentsmith/Sites/node/stupefy/composables/useDatabaseApi.ts).
- [x] Replace the temporary polling-based active-user write with a more robust presence mechanism.
- [x] Add route guards and validation for missing/invalid `room`, `id`, and `key` query params.
- [x] Add proper loading, empty, and retry states for the waiting-room page.
- [x] Confirm parity with the recovered React lobby behavior:
  - room creation rules
  - join-room error messages
  - password handling
  - chat update behavior
  - start-game gating

## Phase 4: Data Model Hardening

- [x] Split the broad `GameState` and `WaitingRoomState` types into narrower application models:
  - persisted Mongo documents
  - API payloads
  - view models
  - gameplay event payloads
- [x] Add runtime parsing/validation for Mongo documents before they are used in UI state.
- [x] Normalize collection naming and room identifiers across:
  - waiting-room DB records
  - game-room DB records
  - route params/query params
  - client-visible room names
- [x] Replace mutation-heavy DB helpers with more deterministic update helpers.
- [x] Remove implicit merge behavior that can silently overwrite state in [`utils/stupefyDB.ts`](/Users/innocentsmith/Sites/node/stupefy/utils/stupefyDB.ts).
- [x] Remove or rewrite legacy queue logic in:
  - [`utils/stupefyDB.ts`](/Users/innocentsmith/Sites/node/stupefy/utils/stupefyDB.ts)
  - [`utils/waitingRoomDB.ts`](/Users/innocentsmith/Sites/node/stupefy/utils/waitingRoomDB.ts)
- [x] Make room creation and game start idempotent.

## Phase 5: Gameplay Logic Preparation

- [x] Inventory the recovered frontend gameplay modules and group them into migration units:
  - board container
  - presentational components
  - turn-cycle helpers
  - card targeting helpers
  - card rule handlers
  - event/popup resolution
- [x] Port pure utility logic from `.recovered-react/javascripts/` and `.recovered-react/components/utils/` into typed shared modules before porting board UI.
  - [x] Extract initial board bootstrap helpers into [`utils/gameplay/bootstrap.ts`](/Users/innocentsmith/Sites/node/stupefy/utils/gameplay/bootstrap.ts).
  - [x] Extract turn-cycle helpers.
  - [x] Extract targeting helpers.
  - [x] Extract event/popup helpers beyond the initial board bootstrap.
- [x] Define the target composable structure for gameplay:
  - `useRoomState`
  - `useBoardActions`
  - `useTurnCycle`
  - `useCardTargets`
  - `useCardResolution`
  - `useRealtimeRoom`
- [x] Decide what logic belongs in shared TypeScript modules versus Vue composables versus page-local state.
- [x] Add fixture data for at least one real room snapshot to support parity testing during the port.

## Phase 6: Gameplay UI Port to Vue

- [x] Replace the temporary placeholder in [`pages/play.vue`](/Users/innocentsmith/Sites/node/stupefy/pages/play.vue) with a real board container.
  - [x] Replace the placeholder with a real game-room loader/bootstrap view.
  - [x] Replace the bootstrap view with interactive board rendering.
- [x] Port `App.js` loading/query behavior from [`.recovered-react/App.js`](/Users/innocentsmith/Sites/node/stupefy/.recovered-react/App.js).
- [x] Port the `Board` container from [`.recovered-react/components/board.jsx`](/Users/innocentsmith/Sites/node/stupefy/.recovered-react/components/board.jsx).
- [x] Port the following presentational components to Vue:
  - `card`
  - `character`
  - `character-card`
  - `card-deck`
  - `player`
  - `table`
  - `sidebar`
  - `alert`
  - `action`
  - `choose-character`
- [~] Port click/selection handling while preserving current gameplay semantics.
  - [x] Port the selection/draw/discard/end-turn flows that are already covered by the extracted shared helpers.
  - [ ] Port the click paths that still depend on the legacy card-rule handlers.
- [~] Port popup/action resolution behavior.
  - [x] Port the popup/action UI shell and resolution dismissal behavior.
  - [ ] Port the action-option handlers that still depend on the legacy card-rule handlers.
- [ ] Port card/turn animations only after functional parity is established.

## Phase 7: Real-Time Layer Decision

- [x] Decide whether the game board should use:
  - Nitro-compatible server events/websocket transport
  - a standalone Socket.IO server
  - polling for selected flows only
- [x] If real-time transport remains required, define a typed event contract for:
  - join room
  - room pause/resume
  - gameplay state sync
  - waiting-room presence
  - waiting-room chat
- [x] Remove dependence on the legacy in-memory `rooms` object from the old server model.
- [x] Ensure real-time updates do not mutate UI state directly without validation.
- [x] Add reconnect/retry behavior that is explicit and testable.

## Phase 8: Card Rule and Gameplay Integrity

- [ ] Port the card-rule modules from the recovered React source into typed TypeScript modules.
- [ ] Add focused tests for:
  - target selection
  - damage and protection resolution
  - turn transitions
  - death handling
  - discard/draw accounting
- [ ] Verify that total card counts remain stable across all major turn paths.
- [ ] Audit character-specific powers and document which are incomplete or broken today.
- [ ] Fix existing rule bugs as they are discovered, but only once parity with the legacy behavior is understood.

## Phase 9: Backend Reliability and Cleanup

- [ ] Replace deprecated Mongo usage everywhere.
- [ ] Add explicit room expiration or archival behavior instead of relying on stale collections.
- [ ] Ensure waiting rooms and game rooms have clear lifecycle transitions.
- [ ] Remove backend code paths that are only kept for compatibility once the Vue port is complete.
- [ ] Remove the recovered React source only after the Vue/Nuxt gameplay port is verified complete.

## Phase 10: UX, Testing, and Release Readiness

- [ ] Add end-to-end coverage for:
  - create room
  - join room
  - waiting-room chat
  - start game
  - core turn flow
- [ ] Add explicit user-facing error messages for all server failures.
- [ ] Add a basic end-game summary and win-condition checks.
- [ ] Add developer documentation for:
  - local setup
  - Docker usage
  - migration architecture
  - remaining known gaps
- [ ] Clean up README once Nuxt becomes the only supported runtime.

## Immediate Next Steps

- [ ] Port the remaining spell/event rule handlers from the recovered `card-rules/*` modules into typed shared modules.
- [ ] Replace the current Phase 6 “explicit fallback alerts” with real action-option handlers once the relevant rules are ported.
- [ ] Tighten the current polling-based room sync into smaller action-level server mutations once the card-rule port is further along.
- [ ] Add gameplay tests around authoritative sync conflicts so simultaneous actions are exercised intentionally.

## Deferred Logic Notes

- The migrated Vue board now renders and supports the already-ported turn-cycle flows locally, but most spell/event click paths still depend on the legacy `card-rules/*` modules. Those paths now raise explicit UI and console feedback instead of silently doing nothing.
- Gameplay state on `/play` now syncs through a server-authoritative polling path instead of remaining local-only after load. The remaining gap is granularity: updates still write validated whole-room snapshots rather than smaller command-level mutations.
- `turnCycle` and several event payloads still rely on dynamic per-player keys such as `id11` and free-form string phases. They are typed safely enough for the current port, but they remain a structural cleanup target for a later refactor because they make deeper rule migration more error-prone.
- Card visibility is still based on whatever the loaded room snapshot contains. The current “hide other hands” toggle only changes presentation; it does not enforce backend privacy guarantees.
- Phase 7 now uses a typed polling transport with optimistic concurrency on `last_updated`, which fixes the previous local-only board divergence. The larger remaining limitation is that updates still write whole-room snapshots, so high-contention gameplay phases should eventually move to smaller action-level mutations or a stronger server-side command model.
