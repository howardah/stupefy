import React, { Component } from "react";
import Card from "./card";

class Character extends Card {
  state = {};

  render() {
    return (
      <div className="character">
        <div
          className={
            this.props.character.fileName +
            " card " +
            this.props.extraClass +
            (this.isEmpty(this.props.character.house)
              ? ""
              : this.props.character.house + " ")
          }
          style={{
            backgroundImage:
              "url('/images/stupefy/characters/" +
              this.props.character.fileName +
              ".jpg')",
          }}
          onClick={this.props.playCard}
        ></div>
        <div className="health card">
          {Array.from(Array(this.props.character.health).keys())
            .reverse()
            .map((v, i) => (
              <div key={i} className={"health wands wands_" + (v + 1)}></div>
            ))}
        </div>
      </div>
    );
  }
}

export default Character;
