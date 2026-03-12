import React, { Component } from "react";
import Card from "./card";
import { emptyCard } from "../javascripts/card-setup";
import "../stylesheets/table.css";
// import {emp}

class Table extends Component {
  tableClickable = (card) => {
    if (this.props.targets.includes("table") && card.fileName !== "")
      return true;
    if (this.props.targets.includes("table-empty") && card.fileName === "")
      return true;
    return false;
  };

  state = {};
  render() {
    const table =
      this.props.table.length > 0
        ? [...this.props.table, emptyCard]
        : [emptyCard, emptyCard];
    return (
      <div className="table">
        {table.map((card, i) => (
          <Card
            key={i}
            index={i}
            extraClass={this.tableClickable(card) ? "clickable " : ""}
            card={card}
            playCard={
              this.tableClickable(card)
                ? () => {
                    this.props.tableClick(card);
                  }
                : () => {}
            }
          />
        ))}
      </div>
    );
  }
}

export default Table;
