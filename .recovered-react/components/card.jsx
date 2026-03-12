import React, { Component } from "react";

class Card extends Component {
  isEmpty = (checker) => {
    return checker === "";
  };

  playCard = () => {
    this.props.playCard(this.props.player, this.props.card);
  };

  style = () => {
    if (this.props.myCard === undefined || this.props.myCard) {
      return this.props.card.fileName === ""
        ? {}
        : {
            backgroundImage:
              "url('/images/stupefy/" + this.props.card.fileName + ".jpg')",
          };
    }
    return {};
  };

  classes = () => {
    let classes = "card";

    if (this.props.myCard === undefined || this.props.myCard) {
      classes += " " + this.props.card.fileName;
      if (!this.isEmpty(this.props.card.house))
        classes += " " + this.props.card.house;
      if (this.isEmpty(this.props.card.fileName)) classes += " empty";
    }

    classes += " " + this.props.extraClass;

    return classes;
  };

  render() {
    return (
      <div
        onClick={this.playCard}
        cardname={this.props.card.fileName}
        className={this.classes()}
        style={this.style()}
      ></div>
    );
  }
}

export default Card;
