import { Container, Sprite, Texture } from "pixi.js";
import { Direction, Position } from "../types";

export class Character extends Container {
    isLocal: boolean = false;
    speed: number = 5;
    direction = {
        up: false,
        down: false,
        left: false,
        right: false,
    };
    facing: Direction = Direction.SOUTH;
    lastUpdate?: number = undefined;
    targetX = 0;
    targetY = 0;

    private interpolationDelay = 100; // ms
    private lastServerUpdate: number = Date.now();
    private previousPosition = { x: 0, y: 0 };
    private targetPosition = { x: 0, y: 0 };
    private isInterpolating = false;

    constructor(assets: Record<string, Texture>, x: number, y: number, isLocal = false) {
        super();

        const crossBowTexture: Texture = assets.crossBowRed;
        const weapon = new Sprite(crossBowTexture);
        weapon.anchor.set(0.5);
        weapon.rotation = Math.PI / 2;
        weapon.y = 40;
        this.addChild(weapon);

        const player = new Sprite(assets.player);
        player.anchor.set(0.5);
        this.addChild(player);

        this.isLocal = isLocal;

        // Set initial position
        this.x = x;
        this.y = y;

        // Setup keyboard listeners
        this.setupKeyboardListeners();
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

    // Call this in your game loop
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

    update(time: any) {
        if (this.isLocal) {
            this.updateLocal(time);
            this.updateRotation();
            return { position: { x: this.x, y: this.y }, facing: this.facing };
        } else {
            this.interpolate(Date.now());
            this.updateRotation();
            return null;
        }
    }

    setFacing() {
        // Check the current movement direction
        const movingUp = this.direction.up;
        const movingDown = this.direction.down;
        const movingLeft = this.direction.left;
        const movingRight = this.direction.right;

        // Determine facing direction based on movement
        if (movingUp && !movingLeft && !movingRight) {
            this.facing = Direction.NORTH;
        } else if (movingUp && movingRight) {
            this.facing = Direction.NORTHEAST;
        } else if (movingRight && !movingUp && !movingDown) {
            this.facing = Direction.EAST;
        } else if (movingDown && movingRight) {
            this.facing = Direction.SOUTHEAST;
        } else if (movingDown && !movingLeft && !movingRight) {
            this.facing = Direction.SOUTH;
        } else if (movingDown && movingLeft) {
            this.facing = Direction.SOUTHWEST;
        } else if (movingLeft && !movingUp && !movingDown) {
            this.facing = Direction.WEST;
        } else if (movingUp && movingLeft) {
            this.facing = Direction.NORTHWEST;
        }
    }

    private updateRotation() {
        switch (this.facing) {
            case Direction.NORTH:
                this.rotation = Math.PI;
                break;
            case Direction.NORTHEAST:
                this.rotation = Math.PI * (5 / 4);
                break;
            case Direction.EAST:
                this.rotation = Math.PI * (3 / 2);
                break;
            case Direction.SOUTHEAST:
                this.rotation = Math.PI * (7 / 4);
                break;
            case Direction.SOUTH:
                this.rotation = 0;
                break;
            case Direction.SOUTHWEST:
                this.rotation = Math.PI * (1 / 4);
                break;
            case Direction.WEST:
                this.rotation = Math.PI / 2;
                break;
            case Direction.NORTHWEST:
                this.rotation = Math.PI * (3 / 4);
                break;
        }
    }

    setupKeyboardListeners() {
        // Create key objects
        const keys = {
            w: keyboard("w"),
            a: keyboard("a"),
            s: keyboard("s"),
            d: keyboard("d"),
        };

        // W key
        keys.w.press = () => {
            this.direction.up = true;
        };
        keys.w.release = () => {
            this.direction.up = false;
        };

        // S key
        keys.s.press = () => {
            this.direction.down = true;
        };
        keys.s.release = () => {
            this.direction.down = false;
        };

        // A key
        keys.a.press = () => {
            this.direction.left = true;
        };
        keys.a.release = () => {
            this.direction.left = false;
        };

        // D key
        keys.d.press = () => {
            this.direction.right = true;
        };
        keys.d.release = () => {
            this.direction.right = false;
        };
    }

    updateLocal(time: any) {
        // Update position based on direction
        if (this.direction.up) {
            this.y -= this.speed * time.deltaTime;
        }
        if (this.direction.down) {
            this.y += this.speed * time.deltaTime;
        }
        if (this.direction.left) {
            this.x -= this.speed * time.deltaTime;
        }
        if (this.direction.right) {
            this.x += this.speed * time.deltaTime;
        }
        this.setFacing();
    }
}

// Helper function to handle keyboard events
function keyboard(value: string) {
    const key: any = {
        value: value,
        isDown: false,
        isUp: true,
        press: undefined,
        release: undefined,
    };

    // Event handlers
    key.downHandler = (event: any) => {
        if (event.key === key.value) {
            if (key.isUp && key.press) {
                key.press();
            }
            key.isDown = true;
            key.isUp = false;
            event.preventDefault();
        }
    };

    key.upHandler = (event: any) => {
        if (event.key === key.value) {
            if (key.isDown && key.release) {
                key.release();
            }
            key.isDown = false;
            key.isUp = true;
            event.preventDefault();
        }
    };

    // Attach event listeners
    window.addEventListener("keydown", key.downHandler.bind(key), false);
    window.addEventListener("keyup", key.upHandler.bind(key), false);

    return key;
}
