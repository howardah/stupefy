import React, { Component } from "react";
import { Redirect } from "react-router-dom";

class JoinRoom extends Component {
  state = {
    roomname: "",
    password: "",
    playername: "",
    redirect: { value: false, location: "" },
  };

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleSubmit = (event) => {
    alert("A name was submitted: " + this.state.roomname);
    event.preventDefault();
  };

  createRoom = () => {
    const apiLocation =
      (process.env.NODE_ENV !== "development"
        ? ""
        : window.location.origin.replace(window.location.port, "4001")) +
      "/database/wait/join/";

    const queryString =
      "?player=" +
      encodeURIComponent(this.state.playername) +
      "&room=" +
      encodeURIComponent(this.state.roomname) +
      (this.state.password
        ? "&pw=" + encodeURIComponent(this.state.password)
        : "");
    console.log("?" + queryString);

    fetch(apiLocation + queryString)
      .then((res) => res.json())
      .then((result) => {
        console.log(result);
        if (result[0]) {
          if (result[0].error) {
            this.props.addAlert(result[0].error);
          } else {
            const location =
              "?room=" +
              result[0].roomName +
              "&id=" +
              result[0].players[result[0].players.length - 1].id +
              "&key=" +
              result[0].password;

            this.setState({ redirect: { value: true, location } });
          }

          console.log(result);

          //   this.setState({ redirect: { value: true, location } });
        } else {
          console.log("whhyyyy");
          this.props.addAlert("This room doesnt exist! Go back to create it.");
        }
      });
  };

  renderRedirect = () => {
    return <Redirect to={"/waiting-room/" + this.state.redirect.location} />;
  };

  render() {
    return (
      <React.Fragment>
        {this.state.redirect.value ? this.renderRedirect() : ""}
        <div
          className="back-button"
          onClick={() => {
            this.props.changeToggle("intro");
          }}
        >
          &lt;- Back
        </div>
        <div className="info-block">
          <div className="text">Enter Your Name:</div>
          <input
            autoComplete="off"
            className="room-input"
            name="playername"
            type="text"
            placeholder="Luna"
            value={this.state.value}
            onChange={this.handleChange}
          />
        </div>

        <div className="info-block bottom">
          <div className="text">Enter Room Details:</div>
          <input
            autoComplete="off"
            className="room-input"
            name="roomname"
            type="text"
            placeholder="Room Name"
            value={this.state.value}
            onChange={this.handleChange}
          />
          <input
            autoComplete="off"
            className="room-input"
            name="password"
            type="text"
            style={{
              marginTop: 0,
            }}
            placeholder="Password? (leave blank for open rooms)"
            value={this.state.password}
            onChange={this.handleChange}
          />
        </div>
        <div onClick={this.createRoom} className="button create">
          join
        </div>
      </React.Fragment>
    );
  }
}

export default JoinRoom;
