import { Application, Container } from "pixi.js";
import { Direction, Position } from "./types";
import { Character } from "./players/character";
import { Bubble } from "./scene/bubble";

export const BOLT_DAMAGE = 10;
export const BOLT_SPEED = 20;
export const BOLT_RELOAD = 500; //ms

export const BUBBLE_DAMAGE = 1;

export const PLAYER_SPEED = 5;
export const PLAYER_MAX_HEALTH = 100;

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

function lerp(start: number, end: number, amount: number) {
    return (1 - amount) * start + amount * end;
}

const MAP_WIDTH = 2500;
const MAP_HEIGHT = 2500;

export class GameApp extends Application {
    public gameView: Container;
    public gameLayer: Container;
    public cameraFollowTarget: Character | null = null;
    public worldBounds = {
        x: 0,
        y: 0,
        width: MAP_WIDTH, // your world width
        height: MAP_HEIGHT, // your world height
    };
    public bubble: Bubble | null = null;

    constructor() {
        super();
        this.gameView = new Container();
        this.gameLayer = new Container();
        this.gameView.addChild(this.gameLayer);
        this.stage.addChild(this.gameView);
    }

    async initApp(config: any) {
        await this.init(config);

        this.bubble = new Bubble(this);
        this.gameView.addChild(this.bubble);
        this.ticker.add(() => {
            this.cameraFollow();
            this.bubble?.update();
        });
    }

    cameraFollow() {
        if (this.cameraFollowTarget == null) {
            return;
        }

        let targetX = this.screen.width / 2 - this.cameraFollowTarget.x;
        let targetY = this.screen.height / 2 - this.cameraFollowTarget.y;

        const lag = 0.04;
        this.gameView.x = lerp(this.gameView.x, targetX, lag);
        this.gameView.y = lerp(this.gameView.y, targetY, lag);
    }
}
