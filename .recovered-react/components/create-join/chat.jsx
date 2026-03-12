import React, { Component } from "react";
import Moment from "react-moment";

class ChatMessage extends Component {
  state = {};

  getName = () => {
    const players = [...this.props.allPlayers],
      index = players.findIndex(
        (player) => player.id == this.props.message.player
      );

    if (index === -1) return "unknown";

    return players[index].name;
  };

  render() {
    return (
      <div
        className={
          "message-container" +
          (this.props.message.player === this.props.id ? " this-player" : "")
        }
      >
        <div className="heading">
          <div className="name">{this.getName()}</div>
          <div className="time">
            <Moment format="h:mm">{this.props.message.time}</Moment>
          </div>
        </div>
        <div className="message">{this.props.message.text}</div>
      </div>
    );
  }
}

export default ChatMessage;
