# Style Issues

This directory tracks style violations that require non-trivial refactoring. Small
violations are fixed in-place; larger ones get a writeup here.

| Done | ID    | Writeup | Summary |
| ---- | ----- | ------- | ------- |
| [ ] | SI-01 | [SI-01-gameplay-rule-engine-split.md](./SI-01-gameplay-rule-engine-split.md) | Split the monolithic gameplay rule engine and move tests alongside the extracted rule areas. |
| [ ] | SI-02 | [SI-02-board-controller-decomposition.md](./SI-02-board-controller-decomposition.md) | Break `useBoardController` into smaller composables for sync, alerts, selections, interactions, and turn actions. |
| [ ] | SI-03 | [SI-03-waiting-room-db-split.md](./SI-03-waiting-room-db-split.md) | Separate waiting-room repository code from lifecycle helpers and command/query operations. |
| [ ] | SI-04 | [SI-04-tighten-shared-state-types.md](./SI-04-tighten-shared-state-types.md) | Replace loose gameplay state typing with explicit unions and narrower structures. |
| [ ] | SI-05 | [SI-05-play-page-orchestration-split.md](./SI-05-play-page-orchestration-split.md) | Move realtime sync and persistence orchestration out of `pages/play.vue`. |
| [ ] | SI-06 | [SI-06-split-deck-catalog-data.md](./SI-06-split-deck-catalog-data.md) | Separate deck and character catalog data from runtime deck-construction logic. |
