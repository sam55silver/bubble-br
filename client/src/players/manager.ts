import { CollisionSystem } from "../collision/collision";
import { BoltState, PlayerState } from "../types";
import { GameApp } from "../common";
import { Character } from "./character";

import { Texture } from "pixi.js";

export class CharacterManager {
    private app: GameApp;
    private assets: Record<string, Texture>;

    public collisionSystem: CollisionSystem;
    public players: Map<string, Character> = new Map();
    public localPlayerId: string | null = null;
    public charsHit: Character[] = [];

    constructor(app: GameApp, assets: Record<string, Texture>) {
        this.app = app;
        this.assets = assets;
        this.collisionSystem = new CollisionSystem();
    }

    createCharacter(player: PlayerState) {
        const character = new Character(this.app, player, this.assets, this.collisionSystem);
        this.players.set(player.id, character);
        this.app.gameLayer.addChild(character);
        this.collisionSystem.addCharacter(character);

        if (this.localPlayerId == player.id) {
            this.app.cameraFollowTarget = character;
        }
    }

    removeCharacter(playerId: string) {
        const character = this.players.get(playerId);
        if (character) {
            this.collisionSystem.removeCharacter(character);
            this.players.delete(playerId);
            character.alive = false;
            character.wholePlayer.destroy();
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

    clampToBounds(player: Character) {
        const padding = 20;

        player.x = Math.max(
            this.app.worldBounds.x + padding,
            Math.min(player.x, this.app.worldBounds.x + this.app.worldBounds.width - padding),
        );
        player.y = Math.max(
            this.app.worldBounds.y + padding,
            Math.min(player.y, this.app.worldBounds.y + this.app.worldBounds.height - padding),
        );
    }

    getPlayer(id: string): Character | undefined {
        return this.players.get(id);
    }

    handleDamage(targetId: string, amount: number) {
        const character = this.players.get(targetId);
        if (character && character.id == this.localPlayerId) {
            character.takeDamage(amount);
        }
    }

    update(time: any): void {
        this.players.forEach((player: Character) => {
            const isLocal = this.localPlayerId == player.id;
            player.update(time, isLocal);

            if (isLocal) {
                this.clampToBounds(player);
            }
        });

        const charsHit = this.collisionSystem.update();
        this.charsHit = this.charsHit.concat(charsHit);
    }
}
