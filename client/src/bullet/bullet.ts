import { Sprite, Texture } from "pixi.js";

export class Bullet extends Sprite {
    velocity: { x: number; y: number };
    id: string;

    constructor(texture: Texture, x: number, y: number, velocity: { x: number; y: number }, id: string) {
        super(texture);
        this.anchor.set(0.5);
        this.position.set(x, y);
        this.velocity = velocity;
        this.id = id;
    }

    update(delta: number) {
        this.x += this.velocity.x * delta;
        this.y += this.velocity.y * delta;
    }
}