import { CollisionSystem } from "../collision/collision";
import { BoltState, Direction, PlayerState, Position } from "../types";
import { Bolt } from "./bolt";
import { Character } from "./character";

import { Application, Texture } from "pixi.js";

export class CharacterManager {
    private app: Application;
    private assets: Record<string, Texture>;
    private collisionSystem: CollisionSystem;

    public players: Map<string, Character> = new Map();
    public localPlayerId: string | null = null;

    constructor(app: Application, assets: Record<string, Texture>) {
        this.app = app;
        this.assets = assets;
        this.collisionSystem = new CollisionSystem();
    }

    createCharacter(player: PlayerState) {
        const character = new Character(this.app, player, this.assets);
        this.players.set(player.id, character);
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
            const player = this.players.get(playerState.id);
            if (!player || player.id == this.localPlayerId) {
                return;
            }
            player.updatePosition(playerState.position);
            player.facing = playerState.facing;
            player.health = playerState.health;

            let boltKeys: string[] = [];
            playerState.bolts.forEach((boltState: BoltState) => {
                const bolt = player.bolts.get(boltState.id);
                if (!bolt) {
                    player.spawnBolt(boltState.id, boltState.position, boltState.facing);
                } else {
                    bolt.updatePosition(boltState.position);
                }
                boltKeys.push(boltState.id);
            });
            const currBolts = Array.from(player.bolts.keys());
            const diff = currBolts.filter((x: string) => !boltKeys.includes(x));

            diff.forEach((boltId: string) => {
                player.bolts.delete(boltId);
            });
        });
    }

    clampToWindow(player: Character) {
        // clamp to screen
        const halfWidth = player.width / 2;
        const halfHeight = player.height / 2;

        player.x = Math.max(halfWidth, Math.min(player.x, this.app.screen.width - halfWidth));
        player.y = Math.max(halfHeight, Math.min(player.y, this.app.screen.height - halfHeight));
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

    update(time: any): void {
        this.players.forEach((player: Character) => {
            const isLocal = this.localPlayerId == player.id;
            player.update(time, isLocal);

            // Then local player
            if (isLocal) {
                this.clampToWindow(player);
            }
        });

        this.collisionSystem.update(time);
    }
}
