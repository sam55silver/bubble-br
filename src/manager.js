import { Character } from "./character";

export class CharacterManager {
  constructor(app, playerTexture) {
    this.app = app;
    this.playerTexture = playerTexture;
    this.characters = new Map(); // Map of all characters (key: playerId, value: Character instance)
    this.localPlayerId = null; // ID of the local player
  }

  // Create a new character
  createCharacter(playerId, isLocal = false) {
    const character = new Character(this.playerTexture);
    this.characters.set(playerId, character);

    if (isLocal) {
      this.localPlayerId = playerId;
    }

    this.app.stage.addChild(character);
  }

  // Remove a character
  removeCharacter(playerId) {
    const character = this.characters.get(playerId);
    if (character) {
      // Remove from PIXI stage if needed
      if (character.parent) {
        character.parent.removeChild(character);
      }
      this.characters.delete(playerId);
    }
  }

  // Update character position
  updateCharacterPosition(playerId, x, y) {
    const character = this.characters.get(playerId);
    if (character) {
      character.x = x;
      character.y = y;
    }
  }

  // Get character state for network transmission
  getCharacterState(playerId) {
    const character = this.characters.get(playerId);
    if (character) {
      return {
        id: playerId,
        x: character.x,
        y: character.y,
        direction: character.direction,
      };
    }
    return null;
  }

  // Get local player's character state
  getLocalCharacterState() {
    return this.getCharacterState(this.localPlayerId);
  }

  // Update all characters
  update(time) {
    this.characters.forEach((character) => {
      character.update(time);
    });
  }

  // Get all character states
  getAllCharacterStates() {
    const states = {};
    this.characters.forEach((playerId, character) => {
      states[playerId] = this.getCharacterState(playerId);
    });
    return states;
  }
}
