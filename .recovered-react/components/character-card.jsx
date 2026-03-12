import React, { Component } from "react";
import Card from "./card";

class CharacterCard extends Card {
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
      </div>
    );
  }
}

export default CharacterCard;
