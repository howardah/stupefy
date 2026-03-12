import React, { Component } from "react";
import CharacterCard from "../components/character-card";
import "../stylesheets/choose-character.css";

class ChooseCharacter extends Component {
  state = {};

  getRoleSentence = () => {
    let message = ", you are ";
    switch (this.props.player.role) {
      case "minister":
        message +=
          "the Minister of Magic. You & your Aurors must " +
          "defeat the Death Eaters and you must survive until the end of the game " +
          "choose a character that you think will help you the most while you strive " +
          "to rid the Wizarding World from this brand of evil.";
        break;
      case "auror":
        message +=
          "an Auror of the Ministry of Magic. You must protect the Minister of Magic" +
          "and help them to defeat the Death Eaters. The Minister must survive until the end of the game " +
          "and you must insure that they do. Even at great risk to yourself. Choose a character fitting " +
          "for this task.";
        break;
      case "death eater":
        message +=
          "a Death Eater. Your goal is to, with your fellow Death Eaters, overthrow the Ministry " +
          "of Magic so you can establish a new world order where Wizards and Witches take their " +
          "rightful place and rule over the Muggles & Mud-Bloods. Choose a character fitting for this task.";
        break;
      case "werewolf":
        message +=
          "a Werewolf. As an outcast from the Wizarding World, your goal is revenge for all the wrongs done to you. " +
          "You must destroy all of the other players. Remember, though, that if the Minister dies " +
          "before all the Death Eaters are dead, then the Death Eaters win & the game ends. Choose " +
          "a character that will help you effect your goal.";
        break;
    }

    return message;
  };

  render() {
    return (
      <div className="choose-character character">
        <div className="holder">
          <div className="title">CHOOSE YOUR CHARACTER</div>
          <div className="briefing">
            {this.props.player.name + this.getRoleSentence()}
          </div>
          {this.props.player.character.map((character, i) => (
            <CharacterCard
              key={i}
              extraClass="clickable "
              character={character}
              playCard={() => {
                this.props.chooseCharacter(character);
              }}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default ChooseCharacter;
