# Deck Card Status

This document summarizes the current main-deck card set as implemented in the migrated Nuxt/Vue gameplay code.

Status meanings:

- `Yes`: the card's gameplay effect is implemented in the current game.
- `Partial`: some of the card works, but part of the intended effect is missing or not enforced.
- `No`: the card exists in the deck or targeting UI, but the gameplay effect is not currently implemented.

Primary code references:

- `utils/stupefy-decks.ts`
- `utils/gameplay/card-rules.ts`
- `utils/gameplay/targeting.ts`
- `utils/gameplay/turn-cycle.ts`
- `utils/gameplay/board-ui.ts`
- `components/gameplay/GameplayPlayer.vue`

| Card                    | Count | Special power                                                                                                             | Functional in current game? |
| ----------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Accio                   |     4 | Steal a chosen card from another player's hand or tableau at close range.                                                 | Yes                         |
| Apparate                |     1 | Reposition yourself between two players in turn order.                                                                    | No                          |
| Aspen Wand              |     1 | Equip to your tableau; extends your wand attack range to 3.                                                               | Yes                         |
| Azkaban                 |     3 | Jail a target; on their turn they must draw for a matching house to escape or lose the turn.                              | Yes                         |
| Broomstick              |     2 | Equip to your tableau; makes you count as 1 farther away from attackers.                                                  | Yes                         |
| Butterbeer              |     6 | Heal 1 damage; also auto-saves a dying player if they still hold one in hand.                                             | Yes                         |
| Dementors               |     2 | Mass attack; each affected player must take a hit or play a Stupefy. Expecto Patronum blocks targeting.                   | Yes                         |
| Diagon Alley            |     2 | Put cards on the table and have players draft one in turn order.                                                          | Yes                         |
| Elder Wand              |     1 | Equip to your tableau; gives unlimited shots during your turn.                                                            | Yes                         |
| Expecto Patronum        |     1 | Equip to your tableau; prevents you from being targeted by Dementors.                                                     | Yes                         |
| Expelliarmus            |     4 | Discard a chosen card from another player's hand or tableau.                                                              | Yes                         |
| Felix Felicis           |     1 | Pair with Stupefy to hit one player twice or two players once each.                                                       | Yes                         |
| Fiendfyre               |     1 | Start a spreading fire test; each victim draws for safety or takes damage and passes the fire on.                         | Yes                         |
| Garroting Gas           |     1 | Mass attack; each affected player must take a hit or play Protego.                                                        | Yes                         |
| Holly Wand              |     1 | Equip to your tableau; extends your wand range to 2 and is meant to resist Yew Wand effects.                              | Partial                     |
| Honeydukes              |     2 | Draw 2 extra cards.                                                                                                       | Yes                         |
| Invisibility Cloak      |     1 | Equip to your tableau; adds an invisibility-based hide defense and combines with Vanishing Cabinet for an automatic miss. | Yes                         |
| Larch Wand              |     1 | Equip to your tableau; extends your wand attack range to 4.                                                               | Yes                         |
| Polyjuice Potion        |     1 | Equip to your tableau; makes other players count as 1 closer for range checks.                                            | Yes                         |
| Protego                 |    12 | Defensive reaction card for Stupefy and Garroting Gas.                                                                    | Yes                         |
| Resurrection Stone      |     1 | Pull the discard pile onto the table and take one discarded card back into your hand.                                     | Yes                         |
| Stupefy                 |    25 | Basic ranged attack spell.                                                                                                | Yes                         |
| Three Broomsticks       |     1 | Heal every living player by 1.                                                                                            | Yes                         |
| Vanishing Cabinet       |     2 | Equip to your tableau; adds a house-based hide defense and combines with Invisibility Cloak for an automatic miss.        | Yes                         |
| Weasleys' Wizard Weezes |     1 | Draw 3 extra cards.                                                                                                       | Yes                         |
| Wizard's Duel           |     3 | Challenge a player to a duel that continues until someone takes a hit instead of casting Stupefy back.                    | Yes                         |
| Yew Wand                |     1 | Equip to your tableau; extends your wand attack range to 4.                                                               | Yes                         |

## Notes

- `Apparate` is the main known deck card that still has an explicit UI placeholder but no migrated action handler yet.
- `Holly Wand` range works, but the deck metadata still contains a `yew-immunity` flag that is not enforced anywhere in the current migrated rules.
