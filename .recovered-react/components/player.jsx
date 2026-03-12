import React, { Component } from "react";
import Character from "./character";
import Card from "./card";
import { emptyCard } from "../javascripts/card-setup";
import "../stylesheets/players.css";

class Player extends Component {
  state = {};
  checkDistance = (rangeOverride) => {
    // Dead players can’t have cards to worry about
    if (this.props.player.character.health === 0) return false;

    // Filter players by whether or not they’re alive
    const players = this.props.players.filter((p) => p.character.health > 0),
      activePlayer = players.filter((p) => p.id === this.props.player_id)[0],
      thisIndex = players.findIndex((p) => p.id === this.props.player.id);

    let range = 1;

    //Range override for things that are always a distance of 1
    if (rangeOverride) range = rangeOverride;

    //Check player's range of attack
    for (let i = 0; i < activePlayer.tableau.length; i++) {
      //Check for polyjuice potions
      if (activePlayer.tableau[i].power?.distance !== undefined) {
        let distance = activePlayer.tableau[i].power.distance;
        range += distance > 0 ? 0 : -distance;
      }

      if (rangeOverride) continue;

      //Count wands only when range isn't overridden.
      if (activePlayer.tableau[i].power?.range !== undefined)
        range += activePlayer.tableau[i].power.range - 1;
    }

    // Lupin is always one closer
    if (activePlayer.character.fileName === "remus_lupin") range++;

    //check if the opponent has distancing powers
    for (let i = 0; i < this.props.player.tableau.length; i++) {
      //Check for brooms
      if (this.props.player.tableau[i].power?.distance !== undefined) {
        let distance = this.props.player.tableau[i].power.distance;
        range -= distance > 0 ? distance : 0;
      }
    }

    //Range cannot be less than 0
    // if (range < 0) range = 0;

    // console.log(
    //   "index: " +
    //     thisIndex +
    //     " range: " +
    //     range +
    //     " | " +
    //     (thisIndex <= range) +
    //     " | " +
    //     (players.length - thisIndex <= range)
    // );

    if (thisIndex <= range || players.length - thisIndex <= range) return true;
    return false;
  };

  playerClasses = () => {
    let classes = "player";
    classes += this.props.index === 0 ? " this-player" : " other-player";

    if (this.props.that.deadPlayers.includes(this.props.player.id)) {
      classes += " dead";
      if (this.props.player.role !== "auror") {
        classes += " " + this.props.player.role.replace(" ", "_");
      } else {
        classes += " auror_" + Math.ceil(Math.random() * 2);
      }
    }

    if (this.props.player.role === "minister") classes += " minister";
    if (
      this.props.player.role === "death eater" &&
      this.props.players[0].character.fileName === "mad-eye_moody"
    )
      classes += " death-eater";

    return classes;
  };

  handClickable = (card, location) => {
    // If it’s a ranged card, then check the range
    if (this.props.targets.includes("range") && !this.checkDistance(1))
      return false;
    if (
      this.props.player.id === this.props.player_id &&
      this.props.targets.includes("my-hand")
    )
      return true;
    if (
      this.props.player.id !== this.props.player_id &&
      this.props.targets.includes("hand")
    )
      return true;
    return false;
  };

  tableauClickable = (card) => {
    // You cannot steal or discard an azkaban card
    if (card.fileName === "azkaban") return false;

    // If it’s a ranged card, then check the range
    if (this.props.targets.includes("range") && !this.checkDistance(1))
      return false;

    // Check if the targets include my tableau's cards or empty spaces
    if (this.props.player.id === this.props.player_id) {
      if (card.fileName !== "" && this.props.targets.includes("my-tableau"))
        return true;
      if (
        card.fileName === "" &&
        this.props.targets.includes("my-tableau-empty")
      )
        return true;
    }

    // Check if the targets include other tableau's cards or empty spaces
    if (this.props.player.id !== this.props.player_id) {
      if (card.fileName !== "" && this.props.targets.includes("tableau"))
        return true;
      if (card.fileName === "" && this.props.targets.includes("tableau-empty"))
        return true;
    }
    return false;
  };

  characterClickable = () => {
    // Dead can’t be attacked
    if (this.props.player.character.health === 0) return false;

    // If it’s a ranged card, then check the range
    if (this.props.targets.includes("range") && !this.checkDistance(1))
      return false;

    if (this.props.targets.includes("wand-range") && !this.checkDistance())
      return false;
    if (
      this.props.player.id === this.props.player_id &&
      this.props.targets.includes("my-character")
    )
      return true;
    if (
      this.props.player.id !== this.props.player_id &&
      this.props.targets.includes("characters")
    )
      return true;

    return false;
  };

  apparate = (index) => {
    let clickable = false;
    if (this.props.targets.includes("between-characters")) clickable = true;
    if (clickable && (index === 0 || index === this.props.players.length - 1))
      clickable = false;
    return clickable;
  };

  render() {
    const tableau = [...this.props.player.tableau, emptyCard];
    return (
      <div className={this.playerClasses()} ref={this.props.innerRef}>
        <h1 className="name-card">{this.props.player.name}</h1>

        <Character
          character={this.props.player.character}
          extraClass={
            (this.characterClickable() ? "clickable " : "") +
            (this.props.that.turnCycle.felix &&
            this.props.that.turnCycle.felix.some((player) => {
              if (this.props.that.turn !== this.props.that.player_id)
                return false;
              return player.id === this.props.player.id;
            })
              ? "selected "
              : "")
          }
          playCard={
            this.characterClickable()
              ? this.props.targets.includes("my-tableau-empty") ||
                this.props.targets.includes("tableau-empty")
                ? () => {
                    this.props.tableauClick(emptyCard, this.props.player);
                  }
                : () => {
                    this.props.characterClick(this.props.player);
                  }
              : () => {}
          }
        />
        <div
          // onClick={() => {
          //   this.tableauClickable() &&
          //     this.props.tableauPlay(this.props.player);
          // }}
          className="tableau"
        >
          {tableau.map((card, i) => (
            <Card
              key={i}
              index={i}
              extraClass={
                (this.tableauClickable(card) ? "clickable " : "") +
                (this.props.that.turnCycle.cards.some((currentCard) => {
                  return currentCard.id === card.id;
                })
                  ? "selected "
                  : "")
              }
              player={this.props.player}
              card={card}
              playCard={
                this.tableauClickable(card)
                  ? () => {
                      this.props.tableauClick(card, this.props.player);
                    }
                  : () => {}
              }
            />
          ))}
        </div>
        <div
          className={"hand" + (this.props.that.showCards ? "" : " collapsed")}
        >
          {this.props.player.hand.map((card, i) => (
            <Card
              myCard={this.props.player.id === this.props.player_id}
              key={i}
              index={i}
              extraClass={
                (this.handClickable(card) ? "clickable " : "") +
                (this.props.that.turnCycle.cards.some((currentCard) => {
                  return currentCard.id === card.id;
                })
                  ? "selected "
                  : "") +
                (this.props.that.turnCycle[
                  "id" + this.props.player.id
                ]?.cards.some((currentCard) => {
                  return currentCard.id === card.id;
                })
                  ? "selected "
                  : "")
              }
              card={card}
              playCard={
                this.handClickable(card)
                  ? () => {
                      this.props.handClick(card, this.props.player);
                    }
                  : () => {}
              }
            />
          ))}
        </div>
        <div
          className={
            "between-characters" +
            (this.apparate(this.props.index) ? " hasclickable" : "")
          }
        >
          <div
            className={
              "inner-after" +
              (this.apparate(this.props.index) ? " clickable" : "")
            }
            onClick={
              this.apparate(this.props.index)
                ? () => {
                    this.props.apparate(this.props.index);
                  }
                : () => {}
            }
          ></div>
        </div>
      </div>
    );
  }
}
export default Player;
