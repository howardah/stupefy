import React, { Component } from "react";

class WaitingPlayer extends Component {
  state = {};
  render() {
    return (
      <div
        className={
          "waiting-player" +
          (this.props.id == this.props.player.id ? " you" : "")
        }
        onClick={() => {
          this.props.sendToSocket("Yeah?");
        }}
      >
        {this.props.player.name}
      </div>
    );
  }
}

export default WaitingPlayer;
