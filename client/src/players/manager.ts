import { PlayerState } from "../types";
import { Character } from "./character";

import { Application, Graphics, Rectangle, Sprite, Texture } from "pixi.js";

export class CharacterManager {
    private app: Application;
    private assets: Record<string, Texture>;
    private players = new Map();
    private bolts = new Map();

    constructor(app: Application, assets: Record<string, Texture>) {
        this.app = app;
        this.assets = assets;
    }

    // Creating characters
    createCharacter(playerId: string, x: number, y: number, isLocal = false) {
        const character = new Character(this.assets, x, y, isLocal);
        this.players.set(playerId, character);
        this.app.stage.addChild(character);
    }

    removeCharacter(playerId: string) {
        const character = this.players.get(playerId);
        if (character) {
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
        let localPlayerPos = null;

        this.players.forEach((player: Character) => {
            const pos = player.update(time);

            if (pos != null) {
                // clamp
                const halfWidth = player.width / 2;
                const halfHeight = player.height / 2;

                player.x = Math.max(
                    halfWidth,
                    Math.min(player.x, this.app.screen.width - halfWidth),
                );
                player.y = Math.max(
                    halfHeight,
                    Math.min(player.y, this.app.screen.height - halfHeight),
                );

                localPlayerPos = { x: player.x, y: player.y };
            }
        });

        this.checkCollisions();
        let localPlayer = null;
        this.players.forEach((player: Character) => {
            const state = player.update(time);
            if (state != null) {
                localPlayer = state;
            }
        });
        return localPlayer;
    }

    private checkCollisions() {
        const characters = Array.from(this.players.values());
        const bolts = Array.from(this.bolts.values());

        for (let i = 0; i < characters.length; i++) {
            for (let j = i + 1; j < characters.length; j++) {
                const char1 = characters[i];
                const char2 = characters[j];

                const bounds1 = this.getCharacterBounds(char1);
                const bounds2 = this.getCharacterBounds(char2);

                if (this.checkCollision(bounds1, bounds2)) {
                    this.handleCollision(char1, char2);
                }
            }
        }

        characters.forEach((character) => {
            bolts.forEach((bolt) => {
                const charBounds = this.getCharacterBounds(character);
                const boltBounds = bolt.getBounds();

                if (this.checkCollision(charBounds, boltBounds)) {
                    this.handleCharacterBoltCollision(character, bolt);
                }
            });
        });
    }

    private getCharacterBounds(character: Character): Rectangle {
        const bounds = character.getBounds();

        const widthShrinkFactor = 0.25;
        const heightShrinkFactor = 0.4;

        const newWidth = bounds.width * widthShrinkFactor;
        const newHeight = bounds.height * heightShrinkFactor;

        const newX = character.x - newWidth / 2;
        const newY = character.y - newHeight / 2;

        return new Rectangle(newX, newY, newWidth, newHeight);
    }

    private checkCollision(a: Rectangle, b: Rectangle): boolean {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    private handleCollision(char1: Character, char2: Character) {
        const dx = char2.x - char1.x;
        const dy = char2.y - char1.y;
        const angle = Math.atan2(dy, dx);

        const pushDistance = 5;

        if (char1.isLocal) {
            char1.x -= Math.cos(angle) * pushDistance;
            char1.y -= Math.sin(angle) * pushDistance;
        }
        if (char2.isLocal) {
            char2.x += Math.cos(angle) * pushDistance;
            char2.y += Math.sin(angle) * pushDistance;
        }
    }

    private handleCharacterBoltCollision(character: Character, bolt: Sprite) {
        console.log(`Collision detected between Character and Bolt`);
        character.tint = 0xff0000;
        setTimeout(() => {
            character.tint = 0xffffff;
        }, 500);
    }
}
