# Style Guide

## Core Principles

- Prefer small, explicit modules over clever abstractions.
- Keep pure game rules separate from Vue/Nuxt state management.
- Favor typed data transformations and predictable state updates.
- Match existing repository structure before introducing new patterns.
- Treat readability and testability as the default tie-breakers.

## Project Structure

- `pages/` contains route-level orchestration only: data loading, page-specific state, and wiring between composables and components.
- `components/` contains presentational UI and local interaction glue. Keep business rules out of components.
- `composables/` contains Vue-specific stateful logic. In gameplay, composables should coordinate board state, persistence, and user actions, not hold raw rule definitions.
- `utils/` contains shared domain logic and infrastructure helpers.
- `utils/gameplay/` is the home for pure gameplay rules, targeting, turn-cycle helpers, and board transformations. New rule logic should land here first.
- `server/routes/` contains thin Nitro handlers that validate input, call utilities, and map failures to HTTP errors.
- `docs/` contains audits, inventories, migration notes, and rule-status documents. Use it for system-level knowledge, not code-adjacent API docs.
- `fixtures/` contains representative test data. Prefer fixtures over large inline setup in tests.

### Module Boundaries

- UI components may import composables and types, but should not import database helpers directly.
- Composables may import `utils/` helpers and types, but should avoid re-implementing domain rules inline.
- `utils/gameplay/` modules should stay framework-agnostic. Do not import Vue APIs there.
- Server routes should delegate persistence and lifecycle behavior to `utils/*DB.ts`, `room-lifecycle.ts`, `parsers.ts`, and related helpers.

## File Size Limits

Current large files such as `utils/gameplay/card-rules.ts` and `composables/gameplay/useBoardController.ts` are maintenance problems, not examples to extend.

- Target file size: `<= 300` lines.
- Hard limit for normal files: `400` lines.
- Temporary exception limit for rule registries or migration files: `600` lines, with a follow-up split planned.
- Target function size: `<= 40` lines.
- Hard limit for functions: `60` lines.
- Maximum parameters per function: `4`.
- Avoid classes larger than `200` lines. Prefer plain functions and typed objects unless a stateful abstraction is clearly simpler.

When touching a file above the limit, prefer extracting helpers instead of adding more branches inline.

## Naming Conventions

- Vue components: `PascalCase.vue` (`GameplayBoard.vue`, `RoomFormPanel.vue`).
- Composables: `camelCase` prefixed with `use` (`useBoardController.ts`).
- Utility modules: `kebab-case.ts` (`turn-cycle.ts`, `room-lifecycle.ts`).
- Route files: follow Nitro conventions with `kebab-case.<method>.ts`.
- Variables and functions: `camelCase`.
- Types and interfaces: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE` for true constants (`GAME_ROOM_IDLE_TTL_MS`); otherwise use `camelCase`.
- Boolean helpers should read as predicates: `hasPower`, `isGameRoomActive`, `canUseHideCards`.
- Test files: colocate with the source module when practical and suffix with `.test.ts`.

### Domain Naming

- Use the repository’s existing gameplay vocabulary: `turnCycle`, `tableau`, `hotseat`, `bystanders`, `boardState`.
- Prefer explicit helper names that describe the rule outcome, not the UI action.
- Use `fileName` only for persisted card/character identifiers because that pattern already exists in game data.

## Function and Class Design

- One function should do one kind of work: compute, validate, transform, or orchestrate. Do not mix all four.
- Prefer pure functions in `utils/gameplay/` and keep mutation localized and obvious when required by the current state model.
- If a function mutates input state, its name and location should make that clear.
- Use early returns for guard clauses. This is already the dominant pattern in utilities and routes.
- Pass structured objects when a function needs more than a few related values or optional arguments.
- Extract repeated state lookups (`activePlayer`, `viewerPlayer`, `ensureTurnCyclePlayerState`) into helpers instead of duplicating array traversal.
- Prefer functions over classes. Introduce a class only when it owns durable state and behavior together, as with the deck abstraction.

## Imports and Dependencies

- Order imports as:
  1. type imports
  2. framework and third-party imports
  3. app imports from `~/...`
  4. relative imports
- Keep one blank line between these groups.
- Prefer `~/` aliases for app code outside tightly-coupled sibling modules.
- Keep `utils/gameplay/` dependencies acyclic. If two rule modules want each other, extract shared logic into a third helper module.
- Add third-party libraries only when they replace substantial custom code or are required by Nuxt infrastructure.
- Before adding a dependency, check whether the same job is already handled by Nuxt, Vue, Bun, or an existing utility module.

## Error Handling and Logging

- Server routes must convert expected failures into `createError(...)` with the correct status code.
- Client-side and composable code should surface user-facing failures through toasts or local error state, then rethrow only when callers need to react.
- Do not silently swallow errors.
- Log with a stable prefix that identifies the layer and feature, for example `[play]`, `[room/create]`, `[wait/create]`.
- Use:
  - `console.error` for failed operations
  - `console.warn` for recoverable conflicts or invalid user actions
  - `console.info` sparingly for meaningful lifecycle checkpoints
- Avoid `console.log` in application code.
- Include relevant identifiers in logs (`room`, `playerId`, route context), but never log secrets or raw passwords.

## Testing Standards

- Use `bun:test` for unit tests.
- Keep tests close to the module they exercise when the module is pure (`utils/gameplay/card-rules.test.ts` is the current model).
- Group tests by behavior with `describe(...)` blocks and sentence-style `test(...)` names.
- Test rule outcomes and state transitions, not implementation details.
- Every gameplay bug fix should add or update a regression test.
- Prefer fixtures from `fixtures/` and small helper constructors over long inline setup.
- For server/database logic, favor narrow unit tests around parser/lifecycle helpers before introducing broad integration tests.

## Documentation

- Keep comments rare and specific. Explain why a rule exists, not what obvious syntax does.
- Add comments for non-obvious game rule translations, data-shape quirks, or migration constraints.
- Do not add boilerplate docblocks to every function.
- When behavior is large enough to need cross-file explanation, document it in `docs/` instead of long source comments.
- Update the relevant docs when implementing or changing card powers, character powers, lifecycle rules, or migration boundaries.

## Code Smells to Avoid

- Growing single-file rule engines or controllers past the size limits.
- Mixing Vue refs/watchers with core gameplay rules in the same module.
- Repeating player/card lookup logic instead of extracting helpers.
- Broad `unknown[]` or index-signature state where a specific type can be introduced.
- Stringly-typed phases and action names scattered across modules without shared unions or constants.
- Route handlers that perform persistence details inline instead of delegating to utilities.
- UI components that mutate shared game state directly.
- Adding new console output without a stable prefix.
- Copy-paste rule branches for similar card behavior instead of shared helper functions.

## Example Good Patterns

- `utils/gameplay/core.ts`: small focused helpers with clear naming and no framework coupling.
- `utils/room-lifecycle.ts`: pure lifecycle normalization with explicit defaults.
- `composables/useDatabaseApi.ts`: one thin API wrapper that centralizes request behavior.
- `server/routes/database/wait/create.get.ts`: thin route handler with explicit error mapping.
- `pages/room/create.vue`: page-level orchestration separated from reusable form UI.
- `components/gameplay/GameplayBoard.vue`: prop/event-based composition without embedding rule logic.
- `docs/gameplay-module-inventory.md`: concise documentation that explains module ownership and intent.

## Enforcement Summary

- New code should follow the structure and naming rules above immediately.
- Existing oversized files should be reduced incrementally whenever touched.
- New gameplay features should add tests and, when relevant, update the matching docs in `docs/`.
- If a proposed change does not clearly fit one layer, split the responsibility until it does.
