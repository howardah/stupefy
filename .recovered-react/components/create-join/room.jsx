import React, { Component } from "react";
import queryString from "query-string";
import WaitingPlayer from "./waiting-player";
import ChatMessage from "./chat";
import socketIOClient from "socket.io-client";
// import io from "socket.io-client/dist/socket.io";
import camelCase from "lodash/camelCase";
import "./room.css";
import { Redirect } from "react-router-dom";

const ENDPOINT =
  process.env.NODE_ENV !== "development"
    ? window.location.origin
    : window.location.origin.replace(window.location.port, "4001");
// const ENDPOINT = window.location.origin "http://127.0.0.1:4001";
// const socket = socketIOClient(ENDPOINT);

console.log(ENDPOINT);

console.log(process.env.NODE_ENV);

// console.log(socket);

class Room extends Component {
  state = {
    q: queryString.parse(this.props.location.search),
    players: [],
    filtered_players: [],
    chat: [],
    id: 0,
    socket: { sockets: {}, users: [] },
    message: "",
    gameState: false,
    startState: true,
  };
  //   getQueryObj = () => {
  //     return queryString.parse(this.props.location.search);
  //   };

  componentDidMount = () => {
    this.socket = socketIOClient(ENDPOINT);
    // Join the socket for the room we’re in
    this.socket.emit("join-waiting-room", {
      room: this.state.q.room,
      socketroom: camelCase(this.state.q.room) + "-waiting",
      id: this.state.q.id,
    });

    // What to do when you get new info from the socket
    this.socket.on("from-the-waiting-room", (data) => {
      this.catchSocket(data);
    });

    const apiLocation = ENDPOINT + "/database/wait/get/";

    const queryString = this.props.location.search;
    console.log(queryString);

    fetch(apiLocation + queryString)
      .then((res) => res.json())
      .then((result) => {
        console.log(result);

        this.setState({ players: result[0].players, chat: result[0].chat });
        this.socket.emit("waiting-players", {
          socketroom: camelCase(this.state.q.room) + "-waiting",
          players: result[0].players,
        });
      });
  };

  //   static getDerivedStateFromProps(props, state)

  componentDidUpdate = (prevProps, prevState) => {
    if (
      prevState.players !== this.state.players ||
      prevState.socket !== this.state.socket
    ) {
      const filtered_players = this.filterPlayer();
      this.setState({ filtered_players });
    }
  };

  catchSocket = (data) => {
    console.log(data);
    this.setState(data);
  };

  sendToSocket = (info) => {
    this.socket.emit("to-waiting-room", {
      room: this.state.q.room,
      socketroom: this.state.q.room.replace(" ", "-") + "-waiting",
      info: info,
    });
  };

  filterPlayer = () => {
    const players = [...this.state.players],
      activePlayers = [];

    for (let socket in this.state.socket.sockets) {
      activePlayers.push(Number(this.state.socket.users[socket]));
    }

    let filtered_players = players.filter((player) => {
      return activePlayers.includes(player.id);
    });

    return filtered_players;
  };

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  enterChat = () => {
    if (this.state.message) {
      const message = this.state.message;

      this.setState({ message: "" });
      const chat = [...this.state.chat],
        newChat = {
          text: message,
          time: Date.now(),
          player: this.state.q.id,
        };

      this.socket.emit("waiting-chat", newChat);
      chat.push(newChat);
      this.setState({ chat: chat });
    }
  };

  startGame = () => {
    if (this.state.startState)
      this.socket.emit("set-up-game", {
        room: camelCase(this.state.q.room),
        players: this.state.filtered_players,
      });
  };

  renderRedirect = () => {
    return <Redirect to={"/play/" + this.props.location.search} />;
  };

  render() {
    return (
      <div className="waiting-room">
        {this.state.gameState ? this.renderRedirect() : ""}
        <header>
          <div className="stupefy-title"></div>
        </header>
        <div className="player-list">
          <h1>{this.state.q.room}</h1>
          {this.state.filtered_players.map((player, index) => (
            <WaitingPlayer
              sendToSocket={this.sendToSocket}
              key={index}
              player={player}
              id={this.state.q.id}
            />
          ))}
          {this.state.gameState ? <a className="button">go to game</a> : ""}
          <div
            onClick={this.startGame}
            className={"button" + (this.state.startState ? "" : " disabled")}
          >
            start game
          </div>
        </div>
        <div className="chat-box">
          <div className="chats">
            {this.state.chat.map((message, i) => (
              <ChatMessage
                key={i}
                id={this.state.q.id}
                message={message}
                allPlayers={this.state.players}
              />
            ))}
          </div>
          <div className="message-input">
            <input
              className="chat-input"
              name="message"
              type="text"
              value={this.state.message}
              onChange={this.handleChange}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") this.enterChat();
              }}
            />
            <div onClick={this.enterChat} className="button submit-chat">
              &#9166;
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Room;
