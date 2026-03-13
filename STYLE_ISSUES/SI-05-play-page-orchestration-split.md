# SI-05: Split Play Page Orchestration

## Files affected

| File | Problem |
| ---- | ------- |
| `pages/play.vue` | 312 lines and combines route data loading, realtime sync, conflict handling, persistence, and UI wiring in one page |

`pages/play.vue` is only slightly over the target size limit, but the problem is not just length. It currently mixes route orchestration with realtime synchronization and persistence conflict handling, which makes the page harder to reason about than the simpler route pages in the repository.

---

## `pages/play.vue`

### Current situation

- Handles:
  - initial room fetch
  - board-state bootstrapping
  - realtime room lifecycle
  - authoritative-state reconciliation
  - persistence error handling
  - mutation watching
  - board component wiring
- The page is effectively acting as a second controller on top of `useBoardController`.

### Proposed fix with ample details

- Keep the page responsible for route-level setup only.
- Extract the rest into one or two composables:
  - `usePlayRoomSync.ts`
    - initial fetch normalization
    - authoritative state application
    - conflict extraction
    - latest-room refresh
    - persistence of local mutations
  - optionally `usePlayStatusItems.ts`
    - small derived UI status helpers if they remain page-specific
- Let `pages/play.vue` become a thin composition layer similar in spirit to `pages/room/create.vue` and `pages/room/join.vue`.
- Avoid moving gameplay rules into the page during the split; keep that work inside gameplay utilities/composables.

---

## Acceptance criteria

- [ ] `pages/play.vue` is reduced to route setup and high-level wiring.
- [ ] Realtime sync and authoritative-state reconciliation move into focused composables.
- [ ] The page drops below the style guide target size.
- [ ] Board persistence and conflict behavior remain unchanged.
- [ ] `bunx tsc --noEmit` passes.

## Issue Status

Open
