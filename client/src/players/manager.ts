import { CollisionSystem } from "../collision/collision";
import { Direction, PlayerState, Position } from "../types";
import { Bolt } from "./bolt";
import { Character } from "./character";

import { Application, Graphics, Rectangle, Sprite, Texture } from "pixi.js";

export class CharacterManager {
    private app: Application;
    private assets: Record<string, Texture>;
    private players = new Map();
    private collisionSystem: CollisionSystem;
    private bolts: { id: string; bolt: Bolt }[] = [];

    constructor(app: Application, assets: Record<string, Texture>) {
        this.app = app;
        this.assets = assets;
        this.collisionSystem = new CollisionSystem();
    }

    createCharacter(playerId: string, x: number, y: number, isLocal = false) {
        const character = new Character(playerId, this.assets, x, y, isLocal);
        this.players.set(playerId, character);
        this.app.stage.addChild(character);
        this.collisionSystem.addCharacter(character);
    }

    removeCharacter(playerId: string) {
        const character = this.players.get(playerId);
        if (character) {
            if (character.parent) {
                character.parent.removeChild(character);
            }
            this.collisionSystem.removeCharacter(character);
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
            player.health = playerState.health;
        });
    }

    spawnBolt(id: string, pos: Position, facing: Direction) {
        const bolt = new Bolt(this.assets, pos, facing, id);
        this.app.stage.addChild(bolt);
        this.bolts.push({ id, bolt });
        this.collisionSystem.addProjectile(bolt);
    }

    getPlayer(id: string): Character | undefined {
        return this.players.get(id);
    }

    handleDamage(sourceId: string, targetId: string, amount: number) {
        const character = this.players.get(targetId);
        if (character && character.isLocal) {
            character.takeDamage(amount);
        }
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

        this.collisionSystem.update(time);

        let localPlayer = null;
        this.players.forEach((player: Character) => {
            const state = player.update(time);
            if (player.isLocal) {
                localPlayer = state;
                if (player.shooting) {
                    this.spawnBolt(player.id, { x: player.x, y: player.y }, player.facing);
                    player.shooting = false;
                }
            }
        });
        this.bolts.forEach(({ bolt }) => {
            bolt.update(time);
        });

        return localPlayer;
    }
}
