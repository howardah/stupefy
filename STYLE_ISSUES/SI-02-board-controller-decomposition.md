# SI-02: Decompose the Board Controller

## Files affected

| File | Problem |
| ---- | ------- |
| `composables/gameplay/useBoardController.ts` | 854 lines, too many responsibilities, and repeated gameplay helper logic that overlaps with rule modules |

`useBoardController.ts` is carrying orchestration, local mutation, click dispatch, power-action discovery, alerting, synchronization bookkeeping, and turn-end rules. It is beyond the style guide limits and is now difficult to change safely.

---

## `composables/gameplay/useBoardController.ts`

### Current situation

- Owns too many concerns at once:
  - local board cloning and reconciliation
  - toast and alert creation
  - computed derived state
  - hand/table/tableau/deck/character click routing
  - discard/tableau placement helpers
  - power-action availability
  - turn-end flow
- Repeats helper concepts already present in `utils/gameplay/*`, such as player lookup and turn-cycle mutation helpers.
- Makes the page layer depend on one very large composable instead of smaller composable boundaries.

### Proposed fix with ample details

- Keep `useBoardController` as the top-level API for the page, but turn it into a composition root over smaller internal composables.
- Suggested split:
  - `useBoardStateSync.ts`
    - clone authoritative state
    - track mutation nonce
    - reconcile signatures
  - `useBoardAlerts.ts`
    - toast + alert list management
  - `useBoardSelections.ts`
    - selected-card handling
    - discard and tableau placement helpers
  - `useBoardInteractions.ts`
    - hand / table / tableau / deck / character click handlers
    - delegates rule work to `utils/gameplay/card-rules`
  - `useBoardPowerActions.ts`
    - derive available power buttons
  - `useBoardTurnActions.ts`
    - `endTurn`
    - `chooseAction`
    - `clearResolutionAction`
- Centralize common local-state helpers in one small internal file instead of redefining them inside the main composable.
- Reduce the main composable to wiring, exports, and a few high-level computed properties.

---

## Acceptance criteria

- [x] `useBoardController.ts` is reduced below the style guide hard limit.
- [x] Internal responsibilities are split into focused composables or helper modules with clear names.
- [x] Duplicate gameplay helper logic is reduced instead of copied into each new file.
- [x] The exported API used by `pages/play.vue` remains stable or is migrated cleanly in one pass.
- [x] `bunx tsc --noEmit` passes.
- [x] Existing gameplay tests still pass.

## Issue Status

Closed
