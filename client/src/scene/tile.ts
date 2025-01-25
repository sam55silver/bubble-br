import { Sprite, Texture } from "pixi.js";

export class Tile extends Sprite {
    constructor(texture: Texture, x: number, y: number, scale: number = 1, rotation: number = 0) {
        super(texture);
        this.anchor.set(0.5, 0.5);
        this.position.set(x, y);
        this.scale.set(scale, scale);
        this.rotation = rotation;
    }
}

export class BackgroundTile extends Sprite {
    constructor(texture: Texture, x: number, y: number, scale: number = 1) {
        super(texture);
        this.anchor.set(0, 0);
        this.position.set(x, y);
        this.scale.set(scale, scale);
    }
}