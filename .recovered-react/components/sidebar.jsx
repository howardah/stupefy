import React, { Component } from "react";
import "../stylesheets/sidebar.css";
import { players } from "../javascripts/card-setup";

class SideBar extends Component {
  state = {};

  classes = (v) => {
    if (v.id === this.props.turn) return "current-player";
    if (this.props.that.deadPlayers.includes(v.id)) return "dead";
    return "";
  };

  myTurn = () => {
    if (this.props.that.turnCycle.phase !== "initial") return false;
    return this.props.turn === this.props.query.id;
  };

  render() {
    return (
      <div
        className={
          "sidebar col-md-4" + (this.props.that.showCards ? "" : " hidden")
        }
      >
        <div className="sidebar-inner">
          <div className="room-name">{this.props.query.room}</div>
          <div className="players">
            {this.props.players.map((v, i) => (
              <div key={v.id} className={this.classes(v)}>
                {v.name}
              </div>
            ))}
          </div>

          <div
            className={"button" + (!this.myTurn() ? " disabled" : "")}
            onClick={this.myTurn() ? this.props.endTurn : () => {}}
          >
            End Turn
          </div>
          <div
            className={"role " + this.props.players[0].role.replace(" ", "_")}
          ></div>
        </div>
        <div className="hidebar">
          <div className="inner" onClick={this.props.toggleCards}></div>
        </div>
      </div>
    );
  }
}

export default SideBar;
