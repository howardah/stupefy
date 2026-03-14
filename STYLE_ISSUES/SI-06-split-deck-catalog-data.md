# SI-06: Separate Deck Catalog Data from Deck Construction

## Files affected

| File                     | Problem                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `utils/stupefy-decks.ts` | 352 lines, mixes canonical card/character catalog data with randomized deck-building logic |

This file is over the style guide target size, and it combines two concerns that should evolve independently: the definition of canonical card/character data and the runtime assembly of a shuffled deck.

---

## `utils/stupefy-decks.ts`

### Current situation

- Holds:
  - hard-coded main deck recipe
  - hard-coded character catalog
  - random file-name assignment for some cards
  - random house assignment during deck construction
- Any future catalog update or rule-driven metadata change requires editing the same module that also handles runtime assembly.

### Proposed fix with ample details

- Split the file into explicit data and builder layers:
  - `utils/game-data/main-deck-catalog.ts`
    - raw card recipe entries only
  - `utils/game-data/character-catalog.ts`
    - character definitions only
  - `utils/game-data/build-main-deck.ts`
    - randomized house distribution
    - runtime ID assignment
    - any visual-variant file-name assignment
- Keep exported shapes compatible with the current callers so this can be refactored without broad fallout.
- Use named helpers instead of chained multi-variable `let` declarations for clarity.

---

## Acceptance criteria

- [x] Canonical card and character definitions live in data-focused modules.
- [x] Runtime deck-construction logic is separate from the catalog data.
- [x] No resulting module exceeds the style guide hard limit.
- [x] Existing deck contents and character definitions remain unchanged.
- [x] `bunx tsc --noEmit` passes.

## Issue Status

Closed
