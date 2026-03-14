# Gameplay Module Inventory

This inventory groups the recovered React gameplay code into migration units for the Vue/Nuxt port.

## Board Container

- `.recovered-react/components/board.jsx`
- Responsibilities:
  - room socket lifecycle
  - board-local UI state
  - click routing
  - turn progression
  - event emission

## Presentational Components

- `.recovered-react/components/player.jsx`
- `.recovered-react/components/card.jsx`
- `.recovered-react/components/character.jsx`
- `.recovered-react/components/character-card.jsx`
- `.recovered-react/components/card-deck.jsx`
- `.recovered-react/components/table.jsx`
- `.recovered-react/components/sidebar.jsx`
- `.recovered-react/components/alert.jsx`
- `.recovered-react/components/action.jsx`
- `.recovered-react/components/choose-character.jsx`

## Turn-Cycle Helpers

- `.recovered-react/components/utils/setup-cycle.js`
- `.recovered-react/components/utils/cycle-cleanse.js`
- `.recovered-react/components/utils/cycle-beginning.js`
- `.recovered-react/components/utils/end-turn.js`
- `.recovered-react/components/utils/turn-tools.js`
- `.recovered-react/components/utils/turn-tools/count-cards.js`
- `.recovered-react/components/utils/turn-tools/discard-selected.js`

Ported into:

- `utils/gameplay/core.ts`
- `utils/gameplay/turn-cycle.ts`
- `utils/gameplay/bootstrap.ts`

## Targeting Helpers

- `.recovered-react/components/utils/get-targets.js`
- `.recovered-react/components/utils/card-targets.js`

Ported into:

- `utils/gameplay/targeting.ts`

## Event / Popup Helpers

- `.recovered-react/components/utils/tools.js`
- `.recovered-react/components/utils/resolve-event.jsx`
- `.recovered-react/components/utils/character-events.jsx`

Ported into:

- `utils/gameplay/events.ts`

## Card Rule Handlers

- `.recovered-react/components/card-rules/*.js`
- `.recovered-react/components/card-rules/spells/*.js`

These remain unported and are the Phase 6 / Phase 8 input set.

## Composable Targets

- `composables/gameplay/useRoomState.ts`
- `composables/gameplay/useBoardActions.ts`
- `composables/gameplay/useTurnCycle.ts`
- `composables/gameplay/useCardTargets.ts`
- `composables/gameplay/useCardResolution.ts`
- `composables/gameplay/useRealtimeRoom.ts`

These are the intended state boundaries for the board port. They currently provide typed derived state and placeholders without migrating the board UI itself.
