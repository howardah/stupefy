import React, { Component } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import "./App.css";
import Board from "./components/board";
import CreateJoin from "./components/create-join/create-join.jsx";
import Room from "./components/create-join/room";
import queryString from "query-string";
import { render } from "@testing-library/react";
import { camelCase } from "lodash";
// import socketIOClient from "socket.io-client";
// const ENDPOINT = "http://127.0.0.1:4001";

// const socket = io();
// const { room } = Qs.parse(location.search, {
//   ignoreQueryPrefix: true,
// });

// const thisPlayer = players[0];

// initialDeck.shuffle();
// characterDeck.shuffle();

class Stupefy extends Component {
  getQueryObj = () => {
    return queryString.parse(this.props.location.search);
  };

  state = {
    setupObj: {},
    q: this.getQueryObj(),
    isLoaded: false,
  };

  componentDidMount() {
    const apiLocation =
      (process.env.NODE_ENV !== "development"
        ? ""
        : window.location.origin.replace(window.location.port, "4001")) +
      "/database/players/";

    fetch(
      apiLocation +
        "?room=" +
        camelCase(this.state.q.room) +
        "&id=" +
        +this.state.q.id
    )
      .then((res) => res.json())
      .then(
        (result) => {
          if (result) {
            console.log(result);
            this.setState({
              setupObj: result[0],
              isLoaded: true,
            });
          } else {
            this.setState({ isLoaded: "no-room" });
          }
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error,
          });
        }
      );
  }

  render() {
    const { error, isLoaded } = this.state;
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div className="loading">Loading...</div>;
    } else if (isLoaded === "no-room") {
      return <div className="loading">This room doesn’t exist!</div>;
    } else {
      // if (typeof this.state.q.id === "string") {
      let q = Object.assign(this.state.q);
      q.id = Number(q.id);
      // }

      return (
        <div className="container">
          <div className="row">
            <Board
              onRef={(ref) => (this.board = ref)}
              query={q}
              setupObj={this.state.setupObj}
            />
          </div>
        </div>
      );
    }
  }
}

function App() {
  const renderRedirect = (location) => {
    return <Redirect to={"/" + location} />;
  };

  return (
    <Router>
      {window.location.pathname === "/" ? renderRedirect("welcome") : ""}
      <Route path="/welcome/" render={(props) => <CreateJoin {...props} />} />
      <Route path="/waiting-room/" render={(props) => <Room {...props} />} />
      <Route path="/play/" render={(props) => <Stupefy {...props} />} />
    </Router>
  );
}

export default App;
