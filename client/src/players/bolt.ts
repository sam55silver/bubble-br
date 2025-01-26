import { Container, Sprite, Texture } from "pixi.js";
import { Direction, Position } from "../types";
import { getRotationFromDirection } from "../common";

export class Bolt extends Container {
    speed: number = 20;
    facing: Direction;
    private alive: boolean = true;

    constructor(assets: Record<string, Texture>, position: Position, direction: Direction) {
        super();

        this.zIndex = 1;

        // Create bullet sprite
        const bolt = new Sprite(assets.crossBowBoltDark); // Assuming you have a bullet texture
        bolt.anchor.set(0.5);
        bolt.rotation = Math.PI / 2;
        this.addChild(bolt);

        // Set initial position
        this.x = position.x;
        this.y = position.y;

        // Set facing direction and initial rotation
        this.facing = direction;
        this.rotation = getRotationFromDirection(direction);
    }

    update(time: any) {
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
