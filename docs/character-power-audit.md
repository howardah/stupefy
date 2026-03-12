# Character Power Audit

This audit captures the current Phase 8 status of character-specific gameplay powers in the migrated Nuxt/Vue codebase.

## Implemented or Preserved in Current Gameplay

- `albus_dumbledore`
  - starting power marker still initializes correctly on turn start
- `bellatrix_lestrange`
  - existing turn-cycle structure still supports multi-step attack responses
- `ginny_weasley`
  - reaction rules now treat `protego` as valid for `stupefy` counters
- `luna_lovegood`
  - any single reaction card can satisfy Protego-style defense
- `mundungus_fletcher`
  - extra hide option is still offered during Stupefy-style defense
- `rubeus_hagrid`
  - Butterbeer healing still grants the extra point when room remains below max health
- `sirius_black`
  - unlimited-shot turn setup remains preserved through turn-cycle helpers

## Partially Supported

- `harry_potter`
  - the old "must die twice in one round" behavior is not fully reimplemented in the current typed death path
- `lily_potter`
  - the old save-another-player interrupt flow is not fully reimplemented in the new popup rule engine
- `dolores_umbridge`
  - the old death-trigger card inheritance behavior is not fully reimplemented
- `molly_weasley`
  - the old choose-who-inherits-my-hand death branch is not fully reimplemented
- `voldemort`
  - the old horcrux-like max-health gain on deaths is not fully reimplemented

## Notes

- The current typed rule engine covers the core card play flow, attack reactions, discard flow, Diagon Alley, Felix, Resurrection Stone, Azkaban escape, and baseline death resolution.
- The remaining gaps are concentrated in advanced death-trigger character powers rather than the core card interaction loop.
