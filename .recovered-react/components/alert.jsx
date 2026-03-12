import React, { Component } from "react";
import "../stylesheets/alert.css";

class Alert extends Component {
  state = {
    hidden: true,
  };

  componentDidMount() {
    setTimeout(() => {
      this.unhide();
    }, 200);
  }

  unhide = () => {
    this.setState({ hidden: false });
  };

  hide = () => {
    this.props.deleteMe(this.props.index);
  };

  render() {
    return (
      <div
        style={{ top: this.props.index * 68 + 10 }}
        className={"alert" + (this.state.hidden ? " hidden" : "")}
      >
        <div className="message">{this.props.message}</div>
        <div className="a" onClick={this.hide}>
          close&nbsp;&nbsp;&nbsp;<span className="x"></span>
        </div>
      </div>
    );
  }
}

export default Alert;
