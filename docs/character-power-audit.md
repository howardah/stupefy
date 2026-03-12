# Character Power Audit

This audit captures the current Phase 8 status of character-specific gameplay powers in the migrated Nuxt/Vue codebase.

## Implemented or Preserved in Current Gameplay

- `albus_dumbledore`
  - starting power marker still initializes correctly on turn start
- `bellatrix_lestrange`
  - existing turn-cycle structure still supports multi-step attack responses
- `dolores_umbridge`
  - now inherits hand cards from defeated players before discard resolution
- `ginny_weasley`
  - reaction rules now treat `protego` as valid for `stupefy` counters
- `harry_potter`
  - first lethal hit in a round is now absorbed and tracked on the character state
- `lily_potter`
  - can now interrupt a death with a typed save prompt and restore the prior turn flow
- `luna_lovegood`
  - any single reaction card can satisfy Protego-style defense
- `molly_weasley`
  - can now choose another player to inherit her hand on death or skip to discard
- `mundungus_fletcher`
  - extra hide option is still offered during Stupefy-style defense
- `rubeus_hagrid`
  - Butterbeer healing still grants the extra point when room remains below max health
- `sirius_black`
  - unlimited-shot turn setup remains preserved through turn-cycle helpers
- `voldemort`
  - now gains health and max-health when other players die

## Notes

- The current typed rule engine covers the core card play flow, attack reactions, discard flow, Diagon Alley, Felix, Resurrection Stone, Azkaban escape, and the previously deferred advanced death-trigger powers.
- Remaining gameplay risk is now concentrated more in long-tail card parity and edge-case sequencing than in the character power branches listed above.
