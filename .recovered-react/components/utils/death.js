import cloneDeep from "lodash/cloneDeep";
import { Deck } from "../../javascripts/deck";
import {
  cardsIncludeName,
  cardsIndexName,
  deathEvent,
  resolutionEvent,
  playerIndex,
  eventIndex,
} from "./tools";
import { universalOrder, naturalOrder } from "./turn-tools/universal-order";

const lilyMessage =
  " is about to die. Would you like to give up a life point to save them?";

const role_message = {
  werewolf: " was a werewolf and has been defeated!",
  "death eater":
    " was a Death Eater and has been defeated. Hooray for the Ministry!",
  auror:
    " was an honorable Auror and has been stuck down. The Dark Mark hovers in the sky!",
};

const checkForLilyEvents = (events) => {
  return events.some((event) => event.popup.message.includes(lilyMessage));
};

export const death = {
  primary: (that, state, turnCycle, options) => {
    const deadPlayers = [...that.state.deadPlayers],
      turnOrder = that.state.turnOrder,
      players = cloneDeep(state.players),
      deck = new Deck(
        [...that.state.deck.cards],
        [...that.state.deck.discards]
      ),
      events = cloneDeep(state.events),
      dyingPlayers = [],
      deathPowers = [];

    const returnAllChanges = () => {
      return {
        deadPlayers,
        players,
        deck,
        events,
      };
    };

    // Tell the turnCycle what we were doing
    // before this person died, so we can go
    // back to it once this is over.
    if (!turnCycle.afterDeath?.phase) {
      turnCycle.afterDeath = {
        phase: turnCycle.phase,
        action: turnCycle.action,
      };
    }

    players.forEach((player) => {
      // Don't worry about them if they've been dead already
      if (deadPlayers.includes(player.id)) return;
      // If they just died save them in an array to deal with
      // one at a time
      if (player.character.health === 0) {
        dyingPlayers.push(player);
        return;
      }
      // See if they’re one of the chracters with powers
      // relating to other players’ deaths
      if (
        player.power.some((power) =>
          ["voldemort", "lily_potter", "dolores_umbridge"].includes(power)
        )
      ) {
        deathPowers.push(player);
      }
    });

    // If there are multiple deaths, resolve them one after the other.
    for (let i = 0; i < dyingPlayers.length; i++) {
      turnCycle.phase = "death";
      turnCycle.action = "death";

      const player = dyingPlayers[i];
      // If they have a butterbeer, then it can be used to save their life
      if (cardsIncludeName(player.hand, "butterbeer")) {
        // Put the card in the discard
        deck.serveCards(
          player.hand.splice(cardsIndexName(player.hand, "butterbeer"))
        );
        // Heal the player
        player.character.health++;
        // Tell everyone what happened
        events.push(
          resolutionEvent(
            "You drank a butterbeer and were spared from death.",
            [player.id],
            player.character.shortName +
              " drank a butterbeer and was spared from death."
          )
        );
        // They’re no longer dying, so we can move on
        // and go back to whatever we were doing before
        turnCycle.phase = turnCycle.afterDeath.phase;
        turnCycle.action = turnCycle.afterDeath.action;
        continue;
      }

      // If they have Harry's power, they has to be shot twice in the same round;
      if (player.power.includes("harry_potter")) {
        // If he they haven’t died already this turn, then they can be saved
        if (!player.character.end || player.character.end.deaths === 0) {
          // Set this death and who killed them
          player.character.end = {
            deaths: 1,
            killer: that.state.turn,
          };
          // Heal them
          player.character.health++;
          // They’re no longer dying, so we can move on
          // and go back to whatever we were doing before
          turnCycle.phase = turnCycle.afterDeath.phase;
          turnCycle.action = turnCycle.afterDeath.action;
          turnCycle.afterDeath = {};
          continue;
        }
      }

      // If Lilly is around (and not dead), she may save the character
      deathPowers.forEach((p) => {
        if (p.power.includes("lily_potter") && options !== "lily-skip") {
          // Create an event
          events.unshift(
            deathEvent(
              player.character.shortName + lilyMessage,
              p,
              [
                { label: "Yes", function: "lily_yes" },
                { label: "No", function: "lily_no" },
              ],
              p.character.shortName +
                " has a chance to save " +
                player.character.shortName +
                "."
            )
          );
        }
      });

      // If there are Lily Events, give them a chance to save
      // the dying player
      if (checkForLilyEvents(events)) return returnAllChanges();

      // == ======== ============ ======== == //
      // Beyond here, they’re definitely dead //
      // == ======== ============ ======== == //

      // Officially kill them
      deadPlayers.push(player.id);
      // Create an resolution event to tell everyone
      events.push(
        resolutionEvent(
          "You are now out, but you can still influence the game! As a House Ghost, you may empower another player each turn.",
          [player.id],
          player.character.shortName + role_message[player.role]
        )
      );

      // If Voldemort is around (and not dead), he made a horcrux
      deathPowers.forEach((p) => {
        if (p.power.includes("voldemort")) {
          // Give all Voldemorts +2 health and +2 max-health
          p.character.health++;
          p.character.maxHealth++;
        }
      });

      // =======
      // Figure out who gets their cards
      // =======

      // Don't worry with it if they don't have cards
      if (player.hand.length > 0) {
        // If they’re Molly or if they have her power
        // Then they get to choose who gets their cards
        if (player.power.includes("molly_weasley")) {
          events.unshift(
            deathEvent(
              "You can choose a player to give your cards to or decide to pass.",
              player,
              [{ label: "skip", function: "molly" }],
              "Molly has died and is choosing who to will her cards to."
            )
          );

          return returnAllChanges();
        }

        // If Unbridge is around, all the cards go to her
        const umbridge = deathPowers.findIndex((p) =>
          p.power.includes("dolores_umbridge")
        );
        if (umbridge !== -1) {
          // Give all cards to umbridge
          deathPowers[umbridge].hand.unshift(...player.hand.splice(0));
        }
      }

      // Anything that’s left goes to the discard
      deck.serveCards(player.hand.splice(0));
      deck.serveCards(player.tableau.splice(0));
    }

    // Go back to whatever we were doing
    turnCycle.phase = turnCycle.afterDeath.phase;
    turnCycle.action = turnCycle.afterDeath.action;
    turnCycle.afterDeath = {};
    return returnAllChanges();
  },
  lily_yes: (that, index, turnCycle) => {
    // We want to use the universal order in case there
    // are multiple players freshly dead, we only want to
    // try to heal the one we asked about.
    const players = cloneDeep(that.state.players),
      lily = players[playerIndex(players, that.state.player_id)],
      deadPlayers = that.state.deadPlayers,
      events = cloneDeep(that.state.events);

    let dyingPlayer;

    for (let i = 0; i < players.length; i++) {
      // The first player that has no health but
      // has not yet been registered as dead is the
      // one that we want to try to heal.
      if (deadPlayers.includes(players[i].id)) continue;
      if (players[i].character.health === 0) {
        dyingPlayer = players[i];
      }
    }

    // Give the dying player a point of health from Lily
    dyingPlayer.character.health++;
    lily.character.health--;

    // Return to whatever we were doing before
    // the dying player started to die
    turnCycle.phase = turnCycle.afterDeath.phase;
    turnCycle.action = turnCycle.afterDeath.action;
    turnCycle.afterDeath = {};

    // Remove all existing events about saving this player
    // including the current one.
    while (
      eventIndex(events, dyingPlayer.character.shortName + lilyMessage) !== -1
    ) {
      events.splice(
        eventIndex(events, dyingPlayer.character.shortName + lilyMessage),
        1
      );
    }

    // Add a resolution event to let everyone
    // else know what happened
    events.unshift(
      resolutionEvent(
        lily.character.shortName +
          " sacrificed a life point to save your life!",
        [dyingPlayer.id],
        lily.character.shortName +
          " sacrificed a life point to save " +
          dyingPlayer.character.shortName +
          "’s life."
      )
    );

    // Put the players back in order
    // players = naturalOrder(players, that.state.player_id);

    // Return the new state
    return { state: { events, players }, resolve: false };
  },
  lily_no: (that, index, turnCycle) => {
    // Remove this event
    const events = cloneDeep(that.state.events);
    events.shift();

    // If there are other "Lily" powers out there, then
    // we need to give them a chance to try to save the player
    if (eventIndex(events, that.state.events[0].popup.message) !== -1) {
      return { state: { events }, resolve: false };
    }

    const dead = death.primary(
      that,
      Object.assign(that.state, { events }),
      turnCycle,
      "lily-skip"
    );

    return { state: dead, resolve: false };
  },
};
