import { Container } from "pixi.js";
import { Direction, Position } from "./types";

export function getRotationFromDirection(direction: Direction): number {
    switch (direction) {
        case Direction.NORTH:
            return Math.PI;
        case Direction.NORTHEAST:
            return Math.PI * (5 / 4);
        case Direction.EAST:
            return Math.PI * (3 / 2);
        case Direction.SOUTHEAST:
            return Math.PI * (7 / 4);
        case Direction.SOUTH:
            return 0;
        case Direction.SOUTHWEST:
            return Math.PI * (1 / 4);
        case Direction.WEST:
            return Math.PI / 2;
        case Direction.NORTHWEST:
            return Math.PI * (3 / 4);
        default:
            return 0;
    }
}

export class RemoteContainer extends Container {
    private interpolationDelay = 100; // ms
    private lastServerUpdate: number = Date.now();
    private previousPosition = { x: 0, y: 0 };
    private targetPosition = { x: 0, y: 0 };
    private isInterpolating = false;

    constructor() {
        super();
    }

    updatePosition(newPos: Position) {
        const now = Date.now();

        // Store current position as previous
        this.previousPosition = {
            x: this.x,
            y: this.y,
        };

        // Update target position
        this.targetPosition = newPos;

        // Reset interpolation timer
        this.lastServerUpdate = now;
        this.isInterpolating = true;
    }

    interpolate(currentTime: number) {
        if (!this.isInterpolating) return;

        const timeSinceUpdate = currentTime - this.lastServerUpdate;
        const interpolationProgress = Math.min(timeSinceUpdate / this.interpolationDelay, 1);

        if (interpolationProgress >= 1) {
            // Interpolation complete
            this.x = this.targetPosition.x;
            this.y = this.targetPosition.y;
            this.isInterpolating = false;
        } else {
            // Interpolate position
            this.x =
                this.previousPosition.x +
                (this.targetPosition.x - this.previousPosition.x) * interpolationProgress;
            this.y =
                this.previousPosition.y +
                (this.targetPosition.y - this.previousPosition.y) * interpolationProgress;
        }
    }
}
