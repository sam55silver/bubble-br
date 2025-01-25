import { Character } from "./character";

import { Application, Texture } from "pixi.js";

export class CharacterManager {
    private app: Application;
    private playerTexture: Texture;
    private remotePlayers = new Map();
    public localPlayer: Character | null = null;

    constructor(app: Application, playerTexture: Texture) {
        this.app = app;
        this.playerTexture = playerTexture;
    }

    // Create a new character
    createCharacter(playerId: string, x: number, y: number, isLocal = false) {
        const character = new Character(playerId, this.playerTexture, x, y);

        if (isLocal) {
            this.localPlayer = character;
        } else {
            this.remotePlayers.set(playerId, character);
        }

        this.app.stage.addChild(character);
    }

    // Remove a character
    removeCharacter(playerId: string) {
        const character = this.remotePlayers.get(playerId);
        if (character) {
            // Remove from PIXI stage if needed
            if (character.parent) {
                character.parent.removeChild(character);
            }
            this.remotePlayers.delete(playerId);
        }
    }

    // Update character position
    updateCharacterPosition(playerId: string, x: number, y: number) {
        const character = this.remotePlayers.get(playerId);
        if (character) {
            character.x = x;
            character.y = y;
        }
    }

    // Get character state for network transmission
    getCharacterState(playerId: string) {
        const character = this.remotePlayers.get(playerId);
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

    // Update all characters
    update(time: any) {
        this.remotePlayers.forEach((character) => {
            character.update(time);
        });
    }

    // Get all character states
    getAllCharacterStates() {
        const states: any = {};
        this.remotePlayers.forEach((playerId: string, _character: Character) => {
            states[playerId] = this.getCharacterState(playerId);
        });
        return states;
    }
}
