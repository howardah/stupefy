# SI-01: Split the Gameplay Rule Engine

## Files affected

| File | Problem |
| ---- | ------- |
| `utils/gameplay/card-rules.ts` | 1,940 lines, many unrelated responsibilities, and too many exported entry points routing through one file |
| `utils/gameplay/card-rules.test.ts` | Regression tests are coupled to the monolithic rule file instead of matching smaller rule modules |

`utils/gameplay/card-rules.ts` is the clearest violation of the style guide. It mixes shared helpers, damage/death resolution, popup handling, spell execution, targeting side-effects, and click routing in one module. That makes rule changes hard to review and increases regression risk.

---

## `utils/gameplay/card-rules.ts`

### Current situation

- Contains both low-level helpers and top-level click handlers.
- Encodes several distinct domains in one place:
  - damage and death handling
  - protection / reaction resolution
  - spell-specific execution
  - event lifecycle helpers
  - UI click dispatch entry points
- Function count is high and the module is well above both the target and hard file-size limits.
- Shared helpers like `activePlayer`, `viewerPlayer`, selection resets, and deck cloning are duplicated elsewhere instead of being centralized.

### Proposed fix with ample details

- Keep the current exported handler surface temporarily so callers do not all change at once:
  - `handleRuleCharacterClick`
  - `handleRuleHandClick`
  - `handleRuleTableauClick`
  - `handleRuleTableClick`
  - `handleRulePopupChoice`
  - `handleRuleDeckClick`
- Move the actual implementations behind that surface into focused modules under a new `utils/gameplay/rules/` directory.
- Suggested split:
  - `rules/shared.ts`
    - deck cloning
    - active/viewer/current event lookup
    - reaction state helpers
    - common discard helpers
  - `rules/damage.ts`
    - `applyDamage`
    - Hermione / Lockhart / Arthur / Draco follow-up effects
  - `rules/death.ts`
    - death queueing
    - Lily interruption flow
    - death cleanup and final consequences
  - `rules/reactions.ts`
    - Protego / house-hide / invisibility responses
    - popup choice resolution helpers
  - `rules/spells.ts`
    - Accio / Expelliarmus / Stupefy / Felix / Fiendfyre / mass events / Diagon Alley / Three Broomsticks
  - `rules/handlers.ts`
    - only the exported click entry points
- Introduce a small shared context type for mutation-heavy helpers so repeated `(state, pushAlert, subject, event)` parameter lists stop expanding.
- After the split, add a thin barrel file at `utils/gameplay/card-rules.ts` that only re-exports the handler functions.

---

## `utils/gameplay/card-rules.test.ts`

### Current situation

- Tests are already valuable, but they mirror the monolithic layout.
- As the rule module grows, the test file will keep growing with it.

### Proposed fix with ample details

- Keep shared state builders in one place, but split tests by rule area:
  - `damage.test.ts`
  - `death.test.ts`
  - `reactions.test.ts`
  - `spells.test.ts`
  - `handlers.test.ts` only for click-routing coverage
- Keep regression tests close to the rule module they protect.
- Preserve the current fixture-driven setup approach; do not switch to ad hoc inline state factories per file.

---

## Acceptance criteria

- [ ] `utils/gameplay/card-rules.ts` is reduced to a small export surface or removed in favor of smaller modules.
- [ ] No new rule module exceeds the style guide hard limits.
- [ ] Shared gameplay helpers are extracted once instead of duplicated across rule modules and composables.
- [ ] Existing gameplay regression coverage is preserved or improved after the split.
- [ ] `bunx tsc --noEmit` passes.
- [ ] Relevant gameplay tests pass.

## Issue Status

Open
