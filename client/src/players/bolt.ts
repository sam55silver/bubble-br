import { Sprite, Texture } from "pixi.js";
import { BoltState, Direction, Position } from "../types";
import { BOLT_SPEED, getRotationFromDirection, RemoteContainer } from "../common";

export class Bolt extends RemoteContainer {
    speed: number = BOLT_SPEED;
    facing: Direction;
    id: string;
    playerId: string;
    alive: boolean = true;
    boltSprite: Sprite;

    constructor(
        playerId: string,
        id: string,
        assets: Record<string, Texture>,
        position: Position,
        direction: Direction,
    ) {
        super();
        this.playerId = playerId;
        this.id = id;

        this.zIndex = 1;

        // Create bullet sprite
        this.boltSprite = new Sprite(assets.crossBowBoltDark); // Assuming you have a bullet texture
        this.boltSprite.anchor.set(0.5);
        this.boltSprite.rotation = Math.PI / 2;
        this.addChild(this.boltSprite);

        // Set initial position
        this.x = position.x;
        this.y = position.y;

        // Set facing direction and initial rotation
        this.facing = direction;
        this.rotation = getRotationFromDirection(direction);
    }

    toBoltState(): BoltState {
        return {
            id: this.id,
            position: { x: this.x, y: this.y },
            facing: this.facing,
            alive: this.alive,
        };
    }

    update(time: any, isLocal: boolean) {
        if (isLocal) {
            this.updateLocal(time);
        } else {
            this.interpolate(Date.now());
        }
    }

    updateLocal(time: any) {
        if (!this.alive) return null;

        // Move based on facing direction
        switch (this.facing) {
            case Direction.NORTH:
                this.y -= this.speed * time.deltaTime;
                break;
            case Direction.NORTHEAST:
                this.x += this.speed * time.deltaTime * Math.cos(Math.PI / 4);
                this.y -= this.speed * time.deltaTime * Math.sin(Math.PI / 4);
                break;
            case Direction.EAST:
                this.x += this.speed * time.deltaTime;
                break;
            case Direction.SOUTHEAST:
                this.x += this.speed * time.deltaTime * Math.cos(Math.PI / 4);
                this.y += this.speed * time.deltaTime * Math.sin(Math.PI / 4);
                break;
            case Direction.SOUTH:
                this.y += this.speed * time.deltaTime;
                break;
            case Direction.SOUTHWEST:
                this.x -= this.speed * time.deltaTime * Math.cos(Math.PI / 4);
                this.y += this.speed * time.deltaTime * Math.sin(Math.PI / 4);
                break;
            case Direction.WEST:
                this.x -= this.speed * time.deltaTime;
                break;
            case Direction.NORTHWEST:
                this.x -= this.speed * time.deltaTime * Math.cos(Math.PI / 4);
                this.y -= this.speed * time.deltaTime * Math.sin(Math.PI / 4);
                break;
        }

        return { x: this.x, y: this.y };
    }

    destroy() {
        this.alive = false;
        super.destroy();
    }

    isAlive(): boolean {
        return this.alive;
    }
}
