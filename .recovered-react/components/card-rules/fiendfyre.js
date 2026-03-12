import { playProtego } from "./spells/protego";
import { takeHit } from "./spells/takeHit";
import { houseHide } from "./spells/houseHide";
import { protegoOptions } from "../utils/character-events";
import { playerIndex, resolutionEvent, cardIndex } from "../utils/tools";
import cloneDeep from "lodash/cloneDeep";
import { Deck } from "../../javascripts/deck";
import { incrementTurn, cycleCleanse } from "../utils/turn-tools";

export const fiendfyre = {
  primary: (given_subject, that, turnCycle) => {
    const events = cloneDeep(that.state.events),
      players = cloneDeep(that.state.players),
      instigator = players[playerIndex(players, that.state.player_id)],
      subject = players[playerIndex(players, given_subject.id)];

    subject.tableau.push(
      instigator.hand.splice(
        cardIndex(instigator.hand, turnCycle.cards[0]),
        1
      )[0]
    );

    const fiendfyreEvent = {
      popup: {
        message:
          instigator.character.shortName +
          " has cast Fiendfyre at you! Draw a card to see if you make it past",
        options: [
          {
            label: "Draw Card",
            function: "draw",
          },
        ],
        popupType: "subtle",
      },
      bystanders: {
        popupType: "subtle",
        message:
          instigator.character.shortName +
          " has cast Fiendfyre at " +
          subject.character.shortName +
          "! They must draw to try to get past.",
        options: [],
      },
      instigator: instigator,
      cardType: "fiendfyre",
      target: [subject.id],
    };

    events.push(fiendfyreEvent);

    turnCycle.phase = "attack";
    turnCycle.action = "fiendfyre";

    return { state: { events, players }, resolve: false };
  },
  draw: (that, index, turnCycle) => {
    const draw = houseHide(that, index),
      events = cloneDeep(that.state.events),
      players = cloneDeep(that.state.players),
      instigator = players[playerIndex(players, events[0].instigator.id)],
      lastSubject = players[playerIndex(players, events[0].target[0])],
      fiendfyreCard = lastSubject.tableau.splice(
        cardIndex(lastSubject.tableau, turnCycle.cards[0]),
        1
      )[0];

    events.shift();

    if (draw.resolve) {
      // Tell everyone that you beat the fiendfyre!
      let message = "You have extinguished the fiendfyre!",
        watchMessage =
          lastSubject.character.shortName + " has extinguished the fiendfyre!";

      const resolve = resolutionEvent(message, [lastSubject.id], watchMessage);
      events.push(resolve);

      // Put the card in the discard
      draw.state.deck.serveCard(fiendfyreCard);

      // reset the turnCycle object
      cycleCleanse(turnCycle, that);

      return {
        state: { events, deck: draw.state.deck, players },
        resolve: false,
      };
    } else {
      // lastSubject takes a hit
      lastSubject.character.health--;

      const nextSubjectId = incrementTurn(
          lastSubject.id,
          that.state.turnOrder,
          that.state.deadPlayers
        ),
        nextSubject = players[playerIndex(players, nextSubjectId)];

      // Put the card in front of them
      nextSubject.tableau.push(fiendfyreCard);

      const fiendfyreEvent = {
        popup: {
          message:
            instigator.character.shortName +
            " cast Fiendfyre and " +
            lastSubject.character.shortName +
            " was just burnt! " +
            " Draw a card to see if you can extinguish it.",
          options: [
            {
              label: "Draw Card",
              function: "draw",
            },
          ],
        },
        bystanders: {
          popupType: "subtle",
          message:
            instigator.character.shortName +
            " cast Fiendfyre and " +
            lastSubject.character.shortName +
            " has been burnt! " +
            nextSubject.character.shortName +
            " must now draw to try to get past.",
          options: [],
        },
        instigator: instigator,
        cardType: "fiendfyre",
        target: [nextSubjectId],
      };

      events.push(fiendfyreEvent);

      return {
        state: { events, players, deck: draw.state.deck, resolve: false },
      };
    }
  },
  resolution: (that, lastAction) => {
    const instigator =
        that.state.players[playerIndex(that.state.players, that.state.turn)],
      subject =
        that.state.players[
          playerIndex(that.state.players, that.state.turnCycle.hotseat)
        ];

    let personalText = "";
    let eventText = "";

    return { event: resolutionEvent(personalText, [subject.id], eventText) };
  },
};
