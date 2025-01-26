import { Container, Graphics } from "pixi.js";
import { GameApp } from "../common";
import { Position } from "../types";

export class Bubble extends Container {
    private bubbleMask: Graphics;
    private radius: number = 1000;
    app: GameApp;

    constructor(app: GameApp) {
        super();
        this.app = app;

        const width = app.worldBounds.width * 4;
        const height = app.worldBounds.height * 4;

        const box = new Graphics()
            .rect(app.worldBounds.x - width / 4, app.worldBounds.y - height / 4, width, height)
            .fill(0x0ea5e9);
        box.alpha = 0.5;
        box.zIndex = 100;

        this.bubbleMask = new Graphics();
        box.setMask({ mask: this.bubbleMask, inverse: true });
        this.addChild(box);

        this.drawBubble();
    }

    private getBubbleCords(): Position {
        return {
            x: this.app.gameView.x + this.app.worldBounds.width / 2,
            y: this.app.gameView.y + this.app.worldBounds.height / 2,
        };
    }

    private drawBubble(): void {
        this.bubbleMask.clear();
        const cords = this.getBubbleCords();
        this.bubbleMask.circle(cords.x, cords.y, this.radius).fill(0x000000);
    }

    public setRadius(newRadius: number): void {
        this.radius = newRadius;
        this.drawBubble();
    }

    public isPointOutside(x: number, y: number): boolean {
        const cords = {
            x: this.app.worldBounds.width / 2,
            y: this.app.worldBounds.width / 2,
        };
        const deltaX = x - cords.x;
        const deltaY = y - cords.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        return distance > this.radius;
    }

    update() {
        this.drawBubble();
    }
}
