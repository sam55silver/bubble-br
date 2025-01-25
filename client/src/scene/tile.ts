import { Sprite, Texture } from "pixi.js";

export class Tile extends Sprite {
    constructor(texture: Texture, x: number, y: number, scale: number = 1) {
        super(texture);
        this.position.set(x, y);
        this.scale.set(scale, scale);
    }
}
