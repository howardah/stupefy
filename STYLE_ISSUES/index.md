# Style Issues

This directory tracks style violations that require non-trivial refactoring. Small
violations are fixed in-place; larger ones get a writeup here.

| Done | ID    | Writeup | Summary |
| ---- | ----- | ------- | ------- |
| [x] | SI-01 | [SI-01-gameplay-rule-engine-split.md](./SI-01-gameplay-rule-engine-split.md) | Split the monolithic gameplay rule engine and move tests alongside the extracted rule areas. |
| [x] | SI-02 | [SI-02-board-controller-decomposition.md](./SI-02-board-controller-decomposition.md) | Break `useBoardController` into smaller composables for sync, alerts, selections, interactions, and turn actions. |
| [x] | SI-03 | [SI-03-waiting-room-db-split.md](./SI-03-waiting-room-db-split.md) | Separate waiting-room repository code from lifecycle helpers and command/query operations. |
| [x] | SI-04 | [SI-04-tighten-shared-state-types.md](./SI-04-tighten-shared-state-types.md) | Replace loose gameplay state typing with explicit unions and narrower structures. |
| [x] | SI-05 | [SI-05-play-page-orchestration-split.md](./SI-05-play-page-orchestration-split.md) | Move realtime sync and persistence orchestration out of `pages/play.vue`. |
| [x] | SI-06 | [SI-06-split-deck-catalog-data.md](./SI-06-split-deck-catalog-data.md) | Separate deck and character catalog data from runtime deck-construction logic. |
| [ ] | SI-07 | [SI-07-legacy-realtime-utilities-cleanup.md](./SI-07-legacy-realtime-utilities-cleanup.md) | Remove or deliberately rebuild legacy realtime helper modules that no longer match the current architecture. |
