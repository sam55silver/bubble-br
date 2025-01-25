import { PlayerState } from "../types";
import { Character } from "./character";

import { Application, Texture } from "pixi.js";

export class CharacterManager {
    private app: Application;
    private assets: Record<string, Texture>;
    private players = new Map();

    constructor(app: Application, assets: Record<string, Texture>) {
        this.app = app;
        this.assets = assets;
    }

    // Create a new character
    createCharacter(playerId: string, x: number, y: number, isLocal = false) {
        const character = new Character(this.assets, x, y, isLocal);
        this.players.set(playerId, character);
        this.app.stage.addChild(character);
    }

    // Remove a character
    removeCharacter(playerId: string) {
        const character = this.players.get(playerId);
        if (character) {
            // Remove from PIXI stage if needed
            if (character.parent) {
                character.parent.removeChild(character);
            }
            this.players.delete(playerId);
        }
    }

    // Update character position
    updateRemoteStates(playerStates: PlayerState[]) {
        playerStates.forEach((playerState: PlayerState) => {
            const player: Character | null = this.players.get(playerState.id);
            if (!player || player.isLocal) {
                return;
            }
            player.updatePosition(playerState.position);
            player.facing = playerState.facing;
        });
    }

    update(time: any) {
        let localPlayer = null;
        this.players.forEach((player: Character) => {
            const state = player.update(time);
            if (state != null) {
                localPlayer = state;
            }
        });
        return localPlayer;
    }
}
