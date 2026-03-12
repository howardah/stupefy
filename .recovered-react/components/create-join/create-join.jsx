import React, { Component } from "react";
import CreateRoom from "./create-room";
import JoinRoom from "./join-room";
import "./create-join.css";
import Alert from "../alert";

class CreateJoin extends Component {
  state = {
    toggle: "intro",
    alerts: [],
  };

  changeToggle = (change) => {
    this.setState({ toggle: change });
  };

  addAlert = (alert) => {
    const alerts = [...this.state.alerts, alert];
    this.setState({ alerts });
  };

  deleteAlert = (i) => {
    let alerts = [...this.state.alerts];
    alerts.splice(i, 1);
    this.setState({ alerts });
  };

  render() {
    return (
      <div className="create-join">
        {this.state.alerts.map((alert, i) => (
          <Alert
            deleteMe={this.deleteAlert}
            index={i}
            key={i}
            message={alert}
          />
        ))}
        <div
          className={
            "intro" + (this.state.toggle === "intro" ? " visible" : " hidden")
          }
        >
          <div className="text">
            Would you like to join an existing room or start a new one?
          </div>
          <div
            onClick={() => {
              this.changeToggle("join");
            }}
            className="button join"
          >
            join
          </div>
          <div
            onClick={() => {
              this.changeToggle("create");
            }}
            className="button create"
          >
            create
          </div>
        </div>
        <div
          className={
            "create-room" +
            (this.state.toggle === "create" ? " visible" : " hidden")
          }
        >
          <CreateRoom
            addAlert={this.addAlert}
            changeToggle={this.changeToggle}
          />
        </div>
        <div
          className={
            "join-room" +
            (this.state.toggle === "join" ? " visible" : " hidden")
          }
        >
          <JoinRoom addAlert={this.addAlert} changeToggle={this.changeToggle} />
        </div>
      </div>
    );
  }
}

export default CreateJoin;
