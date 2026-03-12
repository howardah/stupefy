import {
  playerIndex,
  resolutionEvent,
  eventIndex,
  cardIndex,
} from "../utils/tools";
import cloneDeep from "lodash/cloneDeep";
import { Deck } from "../../javascripts/deck";
import { remove } from "lodash";
import { cycleBeginning } from "../utils/turn-tools";

export const felix = {
  primary: (subject, that, turnCycle) => {
    const subject_index = playerIndex(turnCycle.felix, subject.id);

    turnCycle.phase = "felix";
    if (!turnCycle.felix) {
      turnCycle.felix = [subject];
    } else {
      if (turnCycle.felix.length < 2 && subject_index === -1) {
        turnCycle.felix.push(subject);
      } else if (subject_index !== -1) {
        turnCycle.felix.splice(playerIndex(turnCycle.felix, subject.id), 1);
      } else {
        that.addAlert(
          "You can only shoot a maximum of two players with Felix Felicis. Deselect another player first."
        );
      }
    }

    const events = cloneDeep(that.state.events);

    let felixMessage =
      "Choose one player to cast two spells at or two players to shoot once each.";
    if (eventIndex(events, felixMessage) === -1) {
      const felixEvent = {
        popup: {
          popupType: "subtle",
          message: felixMessage,
          options: [
            {
              label: "Stupefy!",
              function: "shoot",
            },
            {
              label: "X",
              function: "cancel",
            },
          ],
        },
        instigator: that.state.player_id,
        cardType: "felix_felicis",
        target: [that.state.player_id],
      };
      events.push(felixEvent);
    }

    // console.log(turnCycle);
    return { state: { events }, resolve: false };
  },
  shoot: (that) => {
    let turnCycle = cloneDeep(that.state.turnCycle);
    const players = cloneDeep(that.state.players),
      instigator = players[playerIndex(players, that.state.turn)],
      indexes = turnCycle.felix.length === 2 ? [0, 1] : [0, 0],
      events = cloneDeep(that.state.events),
      deck = new Deck(
        [...that.state.deck.cards],
        [...that.state.deck.discards]
      );

    // We’re shooting two Stupefys no matter what
    for (let i = 0; i < 2; i++) {
      players[playerIndex(players, turnCycle.felix[indexes[i]].id)].character
        .health--;
    }

    // Tell everyone what happened
    let message =
      turnCycle.felix.length === 2
        ? turnCycle.felix[0].character.shortName +
          " and " +
          turnCycle.felix[1].character.shortName +
          " were both shot by " +
          instigator.character.shortName +
          "’s Felix-fortefied Stupefy."
        : turnCycle.felix[0].character.shortName +
          " was shot by " +
          instigator.character.shortName +
          "’s Felix-fortefied Stupefy.";
    const resolution = resolutionEvent(message, [instigator.id], message);

    events.push(resolution);

    // Discard the Stupefy and remove Felix from the game.
    turnCycle.cards.forEach((card) => {
      let removedCard = instigator.hand.splice(
        cardIndex(instigator.hand, card),
        1
      )[0];
      if (removedCard.name !== "felix_felicis") deck.serveCard(removedCard);
    });

    turnCycle = cycleBeginning(turnCycle, that);

    return { state: { deck, players, turnCycle, events }, resolve: true };
  },
  cancel: (that) => {
    const turnCycle = cloneDeep(that.state.turnCycle),
      events = cloneDeep(that.state.events);

    events.shift();

    turnCycle.phase = "selected";
    turnCycle.felix = [];

    return { state: { events, turnCycle }, resolve: false };
  },
  resolution: () => {
    return "no resolution";
  },
};
