import React, { Component } from "react";
import { Redirect } from "react-router-dom";

class CreateRoom extends Component {
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
      "/database/wait/create/";

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
        if (result[0]) {
          const location =
            "?room=" +
            result[0].roomName +
            "&id=" +
            result[0].players[0].id +
            "&key=" +
            result[0].password;

          this.setState({ redirect: { value: true, location } });
        } else {
          console.log("whhyyyy");
          this.props.addAlert(
            "This room already exists & in use. Try a different name or go back to join the room."
          );
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
            className="room-input"
            name="playername"
            type="text"
            placeholder="Moony"
            autoComplete="off"
            value={this.state.value}
            onChange={this.handleChange}
          />
        </div>

        <div className="info-block bottom">
          <div className="text">Enter Room Details:</div>
          <input
            className="room-input"
            name="roomname"
            type="text"
            autoComplete="off"
            placeholder="Room Name"
            value={this.state.value}
            onChange={this.handleChange}
          />
          <input
            className="room-input"
            name="password"
            type="text"
            autoComplete="off"
            style={{
              marginTop: 0,
            }}
            placeholder="Password? (leave blank for none)"
            value={this.state.password}
            onChange={this.handleChange}
          />
        </div>
        <div onClick={this.createRoom} className="button create">
          create
        </div>
      </React.Fragment>
    );
  }
}

export default CreateRoom;
