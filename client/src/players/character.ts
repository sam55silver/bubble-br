import { Container, Sprite, Texture } from "pixi.js";
import { Direction, PlayerState, Position } from "../types";
import { getRotationFromDirection } from "../common";
// import { healthUpdater } from "../ui"

export class Character extends Container {
    health: number = 100;
    lastHitTime: number = 0;
    readonly HIT_COOLDOWN = 500;
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
    shooting = false;
    id: string;
    username: string;
    health: number;

    private interpolationDelay = 100; // ms
    private lastServerUpdate: number = Date.now();
    private previousPosition = { x: 0, y: 0 };
    private targetPosition = { x: 0, y: 0 };
    private isInterpolating = false;

    constructor(state: PlayerState, assets: Record<string, Texture>, isLocal = false) {
        super();
        this.id = state.id;
        this.username = state.username;
        this.facing = state.facing;
        this.health = state.health;

        this.zIndex = 2;

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
        this.x = state.position.x;
        this.y = state.position.y;

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
        this.rotation = getRotationFromDirection(this.facing);
    }

    setupKeyboardListeners() {
        // Create key objects
        const keys = {
            w: keyboard("w"),
            a: keyboard("a"),
            s: keyboard("s"),
            d: keyboard("d"),
            space: keyboard(" "),
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

        keys.space.press = () => {
            this.shooting = true;
        };
    }

    updateLocal(time: any) {
        this.setFacing();

        let dx = 0;
        let dy = 0;

        if (this.direction.up) dy -= 1;
        if (this.direction.down) dy += 1;
        if (this.direction.left) dx -= 1;
        if (this.direction.right) dx += 1;

        // Normalize the direction vector if moving diagonally
        if (dx !== 0 && dy !== 0) {
            // Length of diagonal vector is sqrt(2), so divide by sqrt(2) to normalize
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        // Apply movement
        this.x += dx * this.speed * time.deltaTime;
        this.y += dy * this.speed * time.deltaTime;
    }

    takeDamage(amount: number): void {
        const now = Date.now();
        if (now - this.lastHitTime >= this.HIT_COOLDOWN) {
            this.health = Math.max(0, this.health - amount);
            this.lastHitTime = now;
            
            if (this.isLocal) {
                // healthUpdater(this.health);
                // checkDeath(this.health);
            }
        }
    }
    takeForcedDamage(amount: number): void {
        this.health = Math.max(0, this.health - amount);
        if (this.isLocal) {
            // healthUpdater(this.health);
            // checkDeath(this.health);
        }
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
