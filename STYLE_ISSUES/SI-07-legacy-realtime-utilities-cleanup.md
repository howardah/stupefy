# SI-07: Clean Up Legacy Realtime Utility Remnants

## Files affected

| File | Problem |
| ---- | ------- |
| `utils/presence.ts` | Legacy CommonJS module, class-based API, and depends on `redis`, which is not declared in `package.json` |
| `utils/messages.ts` | Legacy chat helper from the old realtime stack; now modernized, but its purpose in the current app should be confirmed |
| `utils/users.ts` | Legacy in-memory chat helper from the old socket-based flow; now modernized, but appears unused in the Nuxt app |

These files look like leftovers from the pre-Nuxt realtime architecture. They are small, but the bigger issue is architectural: it is unclear whether they are still intended to exist. `utils/presence.ts` is especially problematic because it references an undeclared dependency and does not fit the current HTTP-polling waiting-room architecture.

---

## `utils/presence.ts`

### Current situation

- Uses CommonJS patterns inside the TypeScript codebase.
- Depends on `redis`, but `redis` is not present in `package.json`.
- Exposes a singleton class instance with callback-style APIs rather than the async utility style used elsewhere in the repository.
- Appears unused by the current Nuxt server routes and composables.

### Proposed fix with ample details

- First confirm whether Redis-backed presence is still a product requirement.
- If it is not required:
  - remove `utils/presence.ts`
  - remove any roadmap or documentation references that imply it is active code
- If it is still required:
  - reintroduce it deliberately as a supported subsystem
  - add the correct dependency explicitly
  - rewrite it to the repository’s current conventions:
    - ESM imports/exports
    - async functions instead of callback-style APIs
    - small utility modules rather than a mutable singleton class
    - prefixed logging and typed return values

---

## `utils/messages.ts` and `utils/users.ts`

### Current situation

- These have now been normalized to ESM-style exports, but they still appear to be legacy helpers from the old chat/socket flow.
- Neither is referenced by the current Nuxt routes, composables, or pages.

### Proposed fix with ample details

- Verify whether either file has a planned role in the current architecture.
- If not, remove them to reduce dead code.
- If they are meant to stay for a future realtime layer, move them under a clearly named legacy or planned subsystem directory so they do not appear to be active shared utilities.

---

## Acceptance criteria

- [ ] The repo no longer contains unsupported legacy realtime helpers in active utility paths.
- [ ] `utils/presence.ts` is either removed or rebuilt with declared dependencies and current code conventions.
- [ ] Dead legacy helpers are removed or relocated behind an intentional subsystem boundary.
- [ ] `bunx tsc --noEmit` passes.

## Issue Status

Open
