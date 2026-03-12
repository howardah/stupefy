import React, { Component } from "react";
import Card from "./card";
import { drawFunctions } from "../javascripts/event-functions";

class CardDeck extends Component {
  myTurn = () => {
    return !this.props.players[0]["my-turn"];
  };
  myEvent = () => {
    return (
      this.props.events[0] &&
      this.props.events[0]?.cardType !== "resolution" &&
      !this.props.events[0]?.target.includes(this.props.player_id)
    );
  };
  isDrawClickable = () => {
    if (this.props.targets.includes("draw")) return true;
    return false;
  };
  isDiscardClickable = () => {
    if (this.props.targets.includes("discard")) return true;
    return false;
  };

  // playFuction = () => {
  //   if (this.isDrawClickable()) {
  //     if (this.props.players[0]["my-turn"] === "azkaban") {
  //       this.props.azkaban();
  //     } else if (
  //       this.props.events[0] &&
  //       drawFunctions[this.props.events[0].cardType] !== undefined
  //     ) {
  //       this.props.eventFunctions(
  //         this.props.players[0],
  //         "draw",
  //         this.props.events[0].cardType
  //       );
  //     } else {
  //       this.props.drawCard("draw");
  //     }
  //   }
  // };

  render() {
    return (
      <div className="piles">
        <Card
          playCard={
            this.isDrawClickable()
              ? () => {
                  this.props.deckClick("draw");
                }
              : () => {}
          }
          extraClass={
            (this.props.deck.cards[0] ? "draw" : "") +
            (this.isDrawClickable() ? " clickable" : "")
          }
          card={
            this.props.deck.cards[0] || { name: "", fileName: "", house: "" }
          }
        />
        <Card
          playCard={
            this.isDiscardClickable()
              ? () => {
                  this.props.deckClick("discard");
                }
              : () => {}
          }
          extraClass={
            "discard " + (this.isDiscardClickable() ? "clickable" : "")
          }
          card={
            this.props.deck.discards[0] || {
              name: "",
              fileName: "",
              house: "",
            }
          }
        />
      </div>
    );
  }
}

export default CardDeck;
