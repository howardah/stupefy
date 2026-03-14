# SI-04: Tighten Shared Gameplay and Room Types

## Files affected

| File                        | Problem                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| `utils/types.ts`            | Core state types use `unknown[]`, broad index signatures, and stringly-typed gameplay fields              |
| `utils/gameplay/*.ts`       | Many modules rely on dynamic keys and untyped phase/action strings because the shared types are too loose |
| `composables/gameplay/*.ts` | Consumers compensate for loose types with repeated guards and casts                                       |

The style guide explicitly calls out broad `unknown[]`, catch-all index signatures, and scattered string values as smells. `utils/types.ts` is the main source of that looseness.

---

## `utils/types.ts`

### Current situation

- `PlayerState.power` is `unknown[]`.
- `TurnCycle.used` is `unknown[]`.
- `TurnCycle.phase` is `string`.
- `PopupState.popupType` is `string`.
- Several core interfaces expose `[key: string]: unknown`, which makes incorrect state writes easy.
- Dynamic per-player turn-cycle state is stored through stringly keys like `id11`, but there is no typed wrapper for that pattern.

### Proposed fix with ample details

- Introduce explicit unions for gameplay strings:
  - `TurnCyclePhase`
  - `TurnActionName`
  - `PopupType`
  - `CharacterPowerName`
- Replace `unknown[]` with meaningful unions:
  - `PlayerPowerEntry = CharacterPowerName | ...`
  - `TurnCycleUsedEntry = TurnActionName | CharacterPowerName`
- Replace wide index signatures with targeted extension points:
  - typed optional properties where the shape is known
  - a dedicated `TurnCycleReactionMap` or `Record<\`id${number}\`, TurnCyclePlayerState>` for per-player state
- Migrate the gameplay helpers in small passes so the type work produces clearer code instead of a pile of casts.
- Add parser normalization or narrow runtime guards only where the persisted data truly is flexible.

---

## Acceptance criteria

- [x] `utils/types.ts` no longer relies on `unknown[]` for gameplay state collections.
- [x] Core gameplay phases and popup types use explicit unions.
- [x] Broad index signatures are removed or reduced to narrowly-typed structures.
- [x] Gameplay modules compile with fewer casts and guard-only workarounds.
- [x] `bunx tsc --noEmit` passes.

## Issue Status

Closed
