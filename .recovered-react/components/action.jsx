import React, { Component } from "react";
import "../stylesheets/alert.css";

class Alert extends Component {
  state = {
    hidden: true,
  };

  resolutionLoop = () => {
    // If the element still exists and it's not hidden
    // wait a tick, then hide / delete it
    if (
      this.props.actions.popupType === "resolution" &&
      !this.state.hidden &&
      !this.looping
    ) {
      this.looping = true;
      setTimeout(() => {
        this.looping = false;
        this.hide();
        this.resolutionLoop();
      }, 2500);
    }
  };

  componentDidMount() {
    setTimeout(() => {
      // Fade element in a the beginning
      this.unhide();
      // Check the resolution loop so
      // We can fade the element out at the end
      this.resolutionLoop();
    }, 500);
  }

  unhide = () => {
    // Fade element if hidden
    if (this.state.hidden) {
      this.setState({ hidden: false });
    }
  };

  hide = () => {
    // If it's the only resolution event
    // then fade it out before deletion
    if (this.props.that.events.length === 1) {
      this.setState({ hidden: true });
      setTimeout(() => {
        this.props.deleteMe();
      }, 500);
    } else {
      // If there's more than one resolution event
      // delete this one now and move on to the next
      this.props.deleteMe();
    }
  };

  replaceNames = (message) => {
    return message.replace(
      this.props.players[0].character.shortName + " has",
      "You have"
    );
  };

  render() {
    this.resolutionLoop();
    return (
      <div
        className={
          "alert actions" +
          (this.props.actions.popupType
            ? " " + this.props.actions.popupType
            : "") +
          (this.state.hidden ? " hidden" : "")
        }
      >
        <div className={"message"}>
          {this.replaceNames(this.props.actions.message)}
        </div>
        {this.props.actions.options.map((v, i) => (
          <div
            key={i}
            className="a"
            onClick={
              this.props.running
                ? () => this.props.acFunction(v.function, i)
                : () => {
                    this.props.Alert(
                      "An error occurred, can you please try that again?"
                    );
                  }
            }
          >
            {v.label}
          </div>
        ))}
      </div>
    );
  }
}

export default Alert;
