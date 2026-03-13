# Character Card Status

This document summarizes the character deck as implemented in the migrated Nuxt/Vue gameplay code.

Status meanings:

- `Yes`: a character-specific gameplay rule is clearly implemented.
- `Partial`: there is some evidence of support, but the repo does not fully describe or fully enforce the power.
- `No`: no character-specific gameplay rule was found in the migrated code.

Important limitation:

- Several character cards exist in the deck but do not currently have an explicit rule implementation in the migrated codebase.
- For a few others, the repo's audit says parity was preserved, but the exact original tabletop text is not encoded anywhere obvious in the code. Those are marked `Partial` and described as conservatively as possible.

Primary code references:

- `utils/stupefy-decks.ts`
- `utils/gameplay/card-rules.ts`
- `utils/gameplay/events.ts`
- `utils/gameplay/turn-cycle.ts`
- `utils/gameplay/board-ui.ts`
- `docs/character-power-audit.md`

| Character               | Count | Special power                                                                                                                   | Functional in current game? |
| ----------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Albus Dumbledore        |     1 | The current audit says his turn-start power marker is preserved, but the exact effect is not spelled out in the migrated rules. | Partial                     |
| Arthur Weasley          |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Bellatrix Lestrange     |     1 | The current audit says her multi-step attack flow is preserved, but the exact effect is not explicitly documented in code.      | Partial                     |
| Cedric Diggory          |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Dobby                   |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Dolores Umbridge        |     1 | When another player dies, Umbridge inherits that player's hand unless Molly redirects it first.                                 | Yes                         |
| Draco Malfoy            |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Fenrir Greyback         |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Fred & George Weasley   |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Gilderoy Lockhart       |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Ginny Weasley           |     1 | Protego can stand in for Stupefy in the special counter-attack paths that check for a Stupefy card.                             | Yes                         |
| Harry Potter            |     1 | The first lethal hit in a round is absorbed; a later lethal hit in the same round still kills him.                              | Yes                         |
| Hermione Granger        |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| James Potter            |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Lily Potter             |     1 | May spend 1 of her own health to save a dying player before death resolves.                                                     | Yes                         |
| Lucius Malfoy           |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Luna Lovegood           |     1 | Any single reaction card can satisfy Protego-style defense checks.                                                              | Yes                         |
| Alastor "Mad-Eye" Moody |     1 | No character-specific gameplay rule is implemented in the migrated code.                                                        | No                          |
| Minerva McGonagall      |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Molly Weasley           |     1 | On death, Molly may choose another player to inherit her hand instead of discarding it.                                         | Yes                         |
| Mundungus Fletcher      |     1 | Gains an extra hide option during Stupefy-style defense.                                                                        | Yes                         |
| Neville Longbottom      |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Nymphadora Tonks        |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Peeves                  |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Peter Pettigrew         |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Remus Lupin             |     1 | Counts as 1 player closer when range is calculated.                                                                             | Yes                         |
| Ron Weasley             |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Rubeus Hagrid           |     1 | Butterbeer heals him for 2 total if the first point does not already restore him to full health.                                | Yes                         |
| Severus Snape           |     1 | No character-specific power is documented or implemented in the migrated code.                                                  | No                          |
| Sirius Black            |     1 | Gets unlimited shots on his turn.                                                                                               | Yes                         |
| Voldemort               |     1 | Gains 1 health and 1 max health whenever another player dies.                                                                   | Yes                         |

## Notes

- `Mad-Eye Moody` had legacy UI-specific behavior in the recovered React code, but there is no migrated gameplay rule for him in the current Nuxt/Vue implementation.
- The large number of `No` entries reflects the current migrated code, not necessarily the original tabletop design intent.
