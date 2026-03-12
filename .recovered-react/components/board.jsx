import React, { Component, useRef } from "react";
import Player from "./player";
import CardDeck from "./card-deck";
import { Deck } from "../javascripts/deck";
import { CardRules } from "./card-rules";
import { resolveEvent } from "./utils/resolve-event";
import { protegoOptions } from "./utils/character-events";
import { playCard } from "./card-rules/all-rules";
import SideBar from "./sidebar";
import Alert from "./alert";
import Action from "./action";
import Table from "./table";
import socketIOClient from "socket.io-client";
import { ef } from "../javascripts/event-functions";
import cloneDeep from "lodash/cloneDeep";
import {
  titleCase,
  cardsInclude,
  cardIndex,
  playerIndex,
  popUp,
  deathCheck,
  resolutionEvent,
  tableauProblems,
} from "./utils/tools";
import {
  endTurn,
  setupCycle,
  cycleCleanse,
  incrementTurn,
  discard,
  countAllCards,
} from "./utils/turn-tools";
import { getTargets, cardTargets } from "./utils/get-targets";

import { sortPlayers } from "./card-rules/spells/sort-players";
import { initial } from "lodash";
import ChooseCharacter from "./choose-character";

const ENDPOINT =
  process.env.NODE_ENV !== "development"
    ? window.location.origin
    : window.location.origin.replace(window.location.port, "4001");
// const ENDPOINT = window.location.origin "http://127.0.0.1:4001";
// const socket = socketIOClient(ENDPOINT);

class Board extends Component {
  state = {
    players: sortPlayers(
      this.props.setupObj.players,
      this.props.setupObj.turnOrder
    ),
    deck: this.props.setupObj.deck,
    // reaction: emptyReaction,
    actions: {
      message: "",
      options: [],
    },
    events: this.props.setupObj.events || [],
    alerts: [],
    table: this.props.setupObj.table || [],
    turn: this.props.setupObj.turn,
    turnCycle: this.props.setupObj.turnCycle,
    turnOrder: this.props.setupObj.turnOrder,
    deadPlayers: this.props.setupObj.deadPlayers || [],
    player_id: this.props.query.id,
    player_room: this.props.query.room,
    running: true,
    showCards: true,
  };

  componentDidMount = () => {
    this.socket = socketIOClient(ENDPOINT);
    // Join the socket for the room we’re in
    this.socket.emit("join-room", this.state.player_room);

    // What to do when you get new info from the socket
    this.socket.on("from-the-room", (data) => {
      this.catchSocket(data);
    });

    this.socket.on("pause", (time) => {
      console.log(Date.now() - time);
      this.setState({
        running: false,
      });
    });

    this.socket.on("resume", (time) => {
      console.log(Date.now() - time);
      this.setState({
        running: true,
      });
    });

    // Count to make sure we haven’t lost any cards
    const count = countAllCards(this);
    console.log(
      "Card count is " +
        count.length +
        " with " +
        count.duplicates +
        " duplicates: [" +
        count.catcher +
        "]"
    );

    // Catch popups!
    const popup = popUp(this.state, this);
    if (popup) this.setState({ actions: popup });

    if (this.state.turnCycle.phase === "unset")
      this.setState({ turnCycle: setupCycle(this, this.state.turn) });
  };

  pauseRoom = () => {
    this.socket.emit("pause-room", {
      room: this.state.player_room,
      time: Date.now(),
    });
  };

  resumeRoom = () => {
    this.socket.emit("resume-room", {
      room: this.state.player_room,
      time: Date.now(),
    });
  };

  catchSocket = (data) => {
    const popup = popUp(data, this);
    if (popup) data.actions = popup;

    console.log(data);
    this.setState(data);
  };

  addAlert = (alert) => {
    const alerts = [...this.state.alerts, alert];
    this.setState({ alerts });
  };

  deleteAlert = (i) => {
    let alerts = [...this.state.alerts];
    alerts.splice(i, 1);
    this.setState({ alerts });
  };

  emitEvent = (state) => {
    this.socket.emit(
      "stupefy",
      Object.assign({ room: this.state.player_room }, state)
    );

    const popup = popUp(state, this);
    if (popup) state.actions = popup;
    console.log(state);

    this.setState(state);
  };

  nextTurn = () => {
    const turnEnded = endTurn(this);
    if (!turnEnded) return;

    const turn = incrementTurn(
      this.state.turn,
      this.state.turnOrder,
      this.state.deadPlayers
    );

    // Get the turnCycle ready for the next player
    const setup = setupCycle(this, turn);

    // Setup / reset the player’s character powers
    const players = turnEnded.players || cloneDeep(this.state.players),
      player = players[playerIndex(players, turn)];

    player.power = [player.character.fileName];

    this.emitEvent(Object.assign(turnEnded, { turn, players }, setup));
  };

  turnOrder = () => {
    const players = [...this.state.players],
      playerIndex = this.state.turnOrder.indexOf(this.state.player_id);

    // Place this player at the start of the player array
    // while maintaining the correct order
    const beforePlayer = players.splice(0, playerIndex);
    return [...players, ...beforePlayer];
  };

  handClick = (card, player) => {
    // This function determines what to do when you
    // click on a card in a hand given the state of the turn cycle.
    const turnCycle = cloneDeep(this.state.turnCycle);

    if (turnCycle.phase === "initial") {
      turnCycle.cards.push(card);
      turnCycle.phase = "selected";
      turnCycle.action = card.name;

      // We’re finished here for now
      this.emitEvent({ turnCycle });
      return;
    } else if (turnCycle.phase === "stuck-in-azkaban") {
      turnCycle.cards.push(card);
      turnCycle.phase = "selected-stuck-in-azkaban";
      turnCycle.action = "discard";

      // We’re finished here for now
      this.emitEvent({ turnCycle });
      return;
    } else if (turnCycle.phase === "selected-stuck-in-azkaban") {
      if (cardsInclude(turnCycle.cards, card)) {
        turnCycle.cards.splice(cardIndex(turnCycle.cards, card), 1);
      } else {
        turnCycle.cards.push(card);
      }

      if (turnCycle.cards.length === 0) turnCycle.phase = "stuck-in-azkaban";

      // We’re finished here for now
      this.emitEvent({ turnCycle });
      return;
    } else if (turnCycle.phase === "selected") {
      if (player.id === this.state.player_id) {
        if (cardsInclude(turnCycle.cards, card)) {
          turnCycle.cards.splice(cardIndex(turnCycle.cards, card), 1);
        } else {
          turnCycle.cards.push(card);
          turnCycle.action = "discard";
        }

        // Check for the Felix Felicis scenario
        if (
          turnCycle.cards.length === 2 &&
          turnCycle.cards.some((card) => card.name === "stupefy") &&
          turnCycle.cards.some((card) => card.name === "felix_felicis")
        ) {
          turnCycle.action = "felix";
        }
        // Reset action to that of the one card
        if (turnCycle.cards.length === 1) {
          turnCycle.action = turnCycle.cards[0].name;
        }
        // Back to the beginning
        if (turnCycle.cards.length === 0) {
          cycleCleanse(turnCycle, this);
        }

        // We’re finished here for now
        this.emitEvent({ turnCycle });
        return;
      } else {
        const eventCreation = playCard[turnCycle.action].primary(
          player,
          card,
          this,
          turnCycle
        );

        if (!eventCreation) return;
        turnCycle.phase = "attack";

        if (eventCreation.resolve) {
          cycleCleanse(turnCycle, this);
          this.emitEvent(Object.assign(eventCreation.state, { turnCycle }));
          return;
        }
      }
    } else if (turnCycle.phase === "attack") {
      if (player.id === this.state.player_id) {
        if (cardsInclude(turnCycle["id" + this.state.player_id].cards, card)) {
          turnCycle["id" + this.state.player_id].cards.splice(
            cardIndex(turnCycle["id" + this.state.player_id].cards, card),
            1
          );
        } else {
          turnCycle["id" + this.state.player_id].cards.push(card);
        }

        // We’re finished here for now
        this.emitEvent({ turnCycle });
        return;
      }
    }
  };
  tableauClick = (card, player) => {
    // This function determines what to do when you
    // click on a card in a hand given the state of the turn cycle.
    const turnCycle = cloneDeep(this.state.turnCycle);

    if (turnCycle.phase === "initial") {
      turnCycle.cards.push(card);
      turnCycle.phase = "selected-tableau";
      turnCycle.action = "discard";

      // Check if the selected card is the ressurection stone
      if (
        card.name === "resurrection_stone" &&
        // You can only use the stone once per turn
        !turnCycle.used.includes("ressurection_stone")
      ) {
        turnCycle.phase = "ressurection_stone";
        turnCycle.action = "ressurection_stone";
      }

      this.emitEvent({ turnCycle });
      return;
    } else if (
      turnCycle.phase === "selected-tableau" ||
      turnCycle.phase === "ressurection_stone"
    ) {
      if (player.id === this.state.player_id) {
        if (cardsInclude(turnCycle.cards, card)) {
          turnCycle.cards.splice(cardIndex(turnCycle.cards, card), 1);
        } else {
          turnCycle.cards.push(card);
          turnCycle.phase = "selected-tableau";
        }

        if (
          turnCycle.cards.length === 1 &&
          // Check if the selected card is the ressurection stone
          turnCycle.cards[0].name === "resurrection_stone" &&
          // You can only use the stone once per turn
          !turnCycle.used.includes("ressurection_stone")
        ) {
          turnCycle.phase = "ressurection_stone";
          turnCycle.action = "ressurection_stone";
        }

        if (turnCycle.cards.length === 0) cycleCleanse(turnCycle, this);
      }

      this.emitEvent({ turnCycle });
      return;
    }

    if (turnCycle.phase === "selected") {
      if (
        cardTargets(turnCycle.action, turnCycle).includes("my-tableau-empty") ||
        cardTargets(turnCycle.action, turnCycle).includes("tableau-empty")
      ) {
        const players = cloneDeep(this.state.players),
          tableauPlayer = players[playerIndex(players, player.id)],
          handPlayer = players[playerIndex(players, this.state.player_id)];

        tableauPlayer.tableau.push(
          handPlayer.hand.splice(
            cardIndex(handPlayer.hand, turnCycle.cards[0]),
            1
          )[0]
        );

        if (turnCycle.cards[0].name === "fiendfyre") {
          const fiendfyre = playCard.fiendfyre.primary(player, this, turnCycle);

          if (!fiendfyre) return;

          this.emitEvent(Object.assign(fiendfyre.state, { turnCycle }));
          // We’re done here for now
          return;
        }

        cycleCleanse(turnCycle, this);
        const tp = tableauProblems(tableauPlayer.tableau);

        if (tp) {
          this.addAlert(tp);
          return;
        }

        this.emitEvent({ turnCycle, players });
        return;
      } else {
        const eventCreation = playCard[turnCycle.action].primary(
          player,
          card,
          this,
          turnCycle
        );

        if (!eventCreation) return;
        turnCycle.phase = "attack";

        if (eventCreation.resolve) {
          cycleCleanse(turnCycle, this);
          this.emitEvent(Object.assign(eventCreation.state, { turnCycle }));
          return;
        }
      }
    }
  };
  characterClick = (player) => {
    // This function determines what to do when you
    // click on a card in a hand given the state of the turn cycle.
    const turnCycle = cloneDeep(this.state.turnCycle);

    if (turnCycle.phase === "selected" || turnCycle.phase === "felix") {
      const eventCreation = playCard[turnCycle.action].primary(
        player,
        this,
        turnCycle
      );

      console.log(turnCycle);
      if (!eventCreation) return;
      if (turnCycle.phase === "selected") turnCycle.phase = "attack";
      turnCycle.hotseat = player.id;

      if (eventCreation.resolve) {
        cycleCleanse(turnCycle, this);
        this.emitEvent(Object.assign(eventCreation.state, { turnCycle }));
        return;
      } else {
        this.emitEvent(Object.assign(eventCreation.state, { turnCycle }));
      }
    }
  };
  tableClick = (card) => {
    // This function determines what to do when you
    // click on a card in a hand given the state of the turn cycle.
    const turnCycle = cloneDeep(this.state.turnCycle);
    var eventCreation = false;

    if (turnCycle.phase === "selected") {
      eventCreation = playCard[turnCycle.action].primary(card, this, turnCycle);
    } else if (turnCycle.phase === "ressurection_stone") {
      // Lay out all of the cards for the
      eventCreation = playCard[turnCycle.action].primary(card, this, turnCycle);

      this.setState(eventCreation);
      console.log(eventCreation);

      return;
    } else {
      eventCreation = playCard[turnCycle.action].secondary(
        card,
        this,
        turnCycle
      );
    }

    if (!eventCreation) return;

    if (!eventCreation.resolve) {
      this.emitEvent(Object.assign(eventCreation.state, { turnCycle }));
    } else {
      cycleCleanse(turnCycle, this);
      this.emitEvent(Object.assign(eventCreation.state, { turnCycle }));
    }
  };
  deckClick = (drawPile) => {
    // This function determines what to do when you click
    // on the draw or discard pile.
    const turnCycle = cloneDeep(this.state.turnCycle);
    const players = cloneDeep(this.state.players),
      deck = new Deck(
        [...this.state.deck.cards],
        [...this.state.deck.discards]
      );

    // Draw pile first
    if (drawPile === "draw") {
      if (turnCycle.phase === "initial") {
        // If it's the beginning of the cycle then they
        // will be drawing cards
        players[playerIndex(players, this.state.player_id)].hand.unshift(
          deck.drawCard()
        );

        turnCycle.draw--;
        this.emitEvent({ turnCycle, deck, players });
        return;
      }

      // Special event. Azkaban escape:
      if (turnCycle.phase === "azkaban") {
        // Try to draw to see if you get to take a turn.
        const eventCreation = playCard.azkaban(this, turnCycle);

        if (!eventCreation) return;

        // If they didn’t succeed in escaping
        if (!eventCreation.gotit) {
          turnCycle.phase = "stuck-in-azkaban";
          // Give them a few seconds to clock that it’s
          // not their turn anymore
          setTimeout(() => {
            this.nextTurn();
          }, 5000);
        } else {
          // If they escape, start their turn!
          cycleCleanse(turnCycle, this);
        }

        // Submit the changes!
        this.emitEvent(Object.assign(eventCreation.state, { turnCycle }));
        return;
      }
    }

    if (drawPile === "discard") {
      const discardEvent = playCard.discardEvent.primary(this, turnCycle);

      if (!discardEvent) return;

      this.emitEvent(discardEvent.state);
    }
  };
  apparate = (index) => {
    const afterPlayer = cloneDeep(this.turnOrder()),
      turnOrder = [],
      deck = new Deck(
        [...this.state.deck.cards],
        [...this.state.deck.discards]
      );

    const turnCycle = cloneDeep(this.state.turnCycle);

    // Reorder the players
    const thisPlayer = afterPlayer.splice(0, 1),
      beforePlayer = afterPlayer.splice(0, index),
      players = [...beforePlayer, ...thisPlayer, ...afterPlayer];

    players.forEach((player) => turnOrder.push(player.id));

    const player = players[playerIndex(players, this.state.player_id)];

    // Discard the apparate card
    discard(player, deck, turnCycle.cards);
    cycleCleanse(turnCycle, this);

    const location =
        " apparated between " +
        beforePlayer[beforePlayer.length - 1].character.shortName +
        " and " +
        afterPlayer[0].character.shortName +
        ".",
      events = [
        resolutionEvent(
          "You have" + location,
          [player.id],
          player.character.shortName + location
        ),
      ];

    this.emitEvent({ players, turnOrder, turnCycle, deck, events });
  };

  actionClick = (action, index) => {
    this.pauseRoom();
    const turnCycle = cloneDeep(this.state.turnCycle);

    turnCycle["id" + this.state.player_id].choice = action;
    const result = playCard[turnCycle.action][action](this, index, turnCycle);

    if (!result) return;

    let workingState = {};

    if (result.resolve) {
      const events = result.state.events
        ? result.state.events
        : cloneDeep(this.state.events);

      if (events[0].target.length > 1) {
        const event = events[0];
        event.target.splice(event.target.indexOf(this.state.player_id), 1);
        workingState.events = events;
      } else {
        const resolution = playCard[turnCycle.action].resolution(this, action);

        events.shift();

        if (resolution.event) {
          events.unshift(resolution.event);
        }

        turnCycle.phase = "initial";
        workingState.events = events;
      }
    }

    if (result.state.players) {
      const newlyDead = deathCheck(
        result.state.players,
        this.state.deadPlayers
      );
      if (newlyDead.length > 0) {
        const deathObj = playCard.death.primary(
          this,
          Object.assign(result.state, workingState),
          turnCycle
        );

        workingState = Object.assign(workingState, deathObj);

        console.log(deathObj);
        // this.addAlert(
        //   "THIS PLAYER DIES WHEN YOU DO THAT. SETUP THE DEATH FUNCTION."
        // );
        // return;
      }
    }

    // If it's still on the initial phase,
    // then go ahead and reset it
    if (turnCycle.phase === "initial") cycleCleanse(turnCycle, this);
    // Submit all changes
    const state = Object.assign(result.state, workingState);
    this.emitEvent(Object.assign(state, { turnCycle }));

    this.resumeRoom();
  };

  chooseCharacter = (character) => {
    const players = cloneDeep(this.state.players),
      thisPlayer = players[playerIndex(players, this.state.player_id)],
      deck = new Deck(
        [...this.state.deck.cards],
        [...this.state.deck.discards]
      ),
      turnCycle = cloneDeep(this.state.turnCycle);

    // Change the character array to the selected character
    thisPlayer.character = character;

    // If it’s the minister, give them an extra health
    if (thisPlayer.role === "minister") {
      thisPlayer.character.health++;
      thisPlayer.character.maxHealth++;
    }

    thisPlayer.power.push(thisPlayer.character.fileName);

    // Deal out cards equal to the life points
    thisPlayer.hand = deck.drawCards(thisPlayer.character.health);

    // If it's the last one, start the game!
    if (!players.some((p) => Array.isArray(p.character)))
      turnCycle.phase = "initial";

    this.emitEvent({ players, deck, turnCycle });
  };

  clearResolution = () => {
    const events = cloneDeep(this.state.events);
    events.shift();

    const actions = popUp({ events }, this);
    this.setState({ events, actions });
  };

  toggleCards = () => {
    let showCards = !this.state.showCards;
    this.setState({ showCards });
  };

  render() {
    const orderedPlayers = this.turnOrder(),
      targets = this.state.running ? getTargets(this) : [];

    return (
      <React.Fragment>
        {Array.isArray(orderedPlayers[0].character) ? (
          <ChooseCharacter
            chooseCharacter={this.chooseCharacter}
            player={orderedPlayers[0]}
          />
        ) : (
          ""
        )}
        <div className="alert-holder">
          {this.state.actions.message !== "" ? (
            <Action
              that={this.state}
              running={this.state.running}
              Alert={this.addAlert}
              player_id={this.state.player_id}
              players={orderedPlayers}
              actions={this.state.actions}
              acFunction={this.actionClick}
              deleteMe={this.clearResolution}
            />
          ) : (
            ""
          )}
          {this.state.alerts.map((alert, i) => (
            <Alert
              deleteMe={this.deleteAlert}
              index={i}
              key={i}
              message={alert}
            />
          ))}
        </div>
        <div className="col-md-8">
          <CardDeck
            that={this.state}
            targets={targets}
            deckClick={this.deckClick}
            deck={this.state.deck}
          ></CardDeck>
          <Table
            that={this.state}
            targets={targets}
            tableClick={this.tableClick}
            table={this.state.table}
          />
          {orderedPlayers.map((player, i) => (
            <Player
              that={this.state}
              targets={targets}
              player_id={this.state.player_id}
              key={i}
              index={i}
              player={player}
              players={orderedPlayers}
              handClick={this.handClick}
              tableauClick={this.tableauClick}
              characterClick={this.characterClick}
              apparate={this.apparate}
            ></Player>
          ))}
        </div>
        <SideBar
          that={this.state}
          player_id={this.state.player_id}
          endTurn={this.nextTurn}
          boardDeets={this.board}
          query={this.props.query}
          players={orderedPlayers}
          turn={this.state.turn}
          toggleCards={this.toggleCards}
        />
      </React.Fragment>
    );
  }
}

export default Board;
