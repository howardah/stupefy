# SI-03: Split Waiting Room Persistence by Responsibility

## Files affected

| File                     | Problem                                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `utils/waitingRoomDB.ts` | 516 lines, combines collection access, lifecycle normalization, presence pruning, room access checks, room mutation commands, and game-start logic |

`utils/waitingRoomDB.ts` is a backend utility that currently acts as both repository layer and business-rule layer. That violates the style guide’s module-boundary rules and makes persistence changes harder to isolate.

---

## `utils/waitingRoomDB.ts`

### Current situation

- Contains low-level Mongo collection helpers and higher-level waiting-room actions in the same file.
- Handles several unrelated workflows:
  - reading and writing waiting rooms
  - open-room listing
  - join/create/get access checks
  - presence bookkeeping
  - ready-state changes
  - chat updates
  - start-game transition
- Repeats lifecycle normalization inside different flows.
- Exceeds the style guide hard file-size limit.

### Proposed fix with ample details

- Split the module into a small persistence layer plus command-style operations.
- Suggested structure:
  - `utils/waiting-room/repository.ts`
    - `withClient`
    - collection getters
    - `readWaitingRoom`
    - `writeWaitingRoom`
    - list collection names
  - `utils/waiting-room/lifecycle.ts`
    - `prunePresence`
    - `ensureReadyMap`
    - `areAllPlayersReady`
    - `playersForGame`
  - `utils/waiting-room/queries.ts`
    - `getWaitRoom`
    - `getWaitRoomAccess`
    - `listOpenWaitRooms`
  - `utils/waiting-room/commands.ts`
    - `joinWaitRoom`
    - `updateActive`
    - `updateReadyStatus`
    - `removeActiveSession`
    - `addChat`
    - `makeWaitRoom`
    - `startWaitRoomGame`
- Keep a thin compatibility barrel at `utils/waitingRoomDB.ts` while callers migrate.
- Reuse the existing room lifecycle helpers instead of reapplying ad hoc normalization in multiple branches.

---

## Acceptance criteria

- [x] No waiting-room persistence module exceeds the style guide hard limit.
- [x] Mongo collection access is separated from waiting-room command/query logic.
- [x] Presence pruning and ready-map normalization live in one reusable helper module.
- [x] Existing server route behavior remains unchanged.
- [x] `bunx tsc --noEmit` passes.

## Issue Status

Closed
