import { Sprite, Texture, Text, Container, Graphics } from "pixi.js";
import { BoltState, Direction, PlayerState, Position } from "../types";
import {
    BUBBLE_DAMAGE,
    GameApp,
    getRotationFromDirection,
    PLAYER_MAX_HEALTH,
    PLAYER_SPEED,
    RemoteContainer,
} from "../common";
import { Bolt } from "./bolt";
import { CollisionSystem } from "../collision/collision";
import { AudioSystem } from "../audio/audio";

export class Character extends RemoteContainer {
    speed: number = PLAYER_SPEED;
    direction = {
        up: false,
        down: false,
        left: false,
        right: false,
    };
    lastHitTime: number = 0;
    readonly HIT_COOLDOWN = 500;
    facing: Direction = Direction.SOUTH;
    lastUpdate?: number = undefined;
    targetX = 0;
    targetY = 0;
    shooting = false;
    id: string;
    username: string;

    collisionSystem: CollisionSystem;

    health: number;
    maxHealth = PLAYER_MAX_HEALTH;
    healthBar: Graphics;
    healthWidth: number;
    healthHeight: number;
    healthBarColour = 0x22c55e;

    bolts: Map<string, Bolt> = new Map();
    app: GameApp;
    assets: Record<string, Texture>;
    playerContainer: Container;
    wholePlayer: Container;

    alive: boolean = true;

    constructor(
        app: GameApp,
        state: PlayerState,
        assets: Record<string, Texture>,
        collisionSystem: CollisionSystem,
    ) {
        super();
        this.app = app;
        this.assets = assets;
        this.collisionSystem = collisionSystem;
        this.id = state.id;
        this.username = state.username;
        this.facing = state.facing;
        this.health = state.health;

        this.zIndex = 2;

        this.wholePlayer = new Container();
        this.addChild(this.wholePlayer);

        this.playerContainer = new Container();
        this.wholePlayer.addChild(this.playerContainer);

        const crossBowTexture: Texture = assets.crossBowRed;
        const weapon = new Sprite(crossBowTexture);
        weapon.anchor.set(0.5);
        weapon.rotation = Math.PI / 2;
        weapon.y = 40;
        this.playerContainer.addChild(weapon);

        const player = new Sprite(assets.player);
        player.anchor.set(0.5);
        this.playerContainer.addChild(player);

        const textContainer = new Container();
        textContainer.y = -60;
        this.wholePlayer.addChild(textContainer);

        const usernameText = new Text({
            text: state.username,
            style: {
                fontFamily: "Xolonium",
                fontSize: 20,
                fill: "white",
                align: "center",
            },
        });
        usernameText.anchor.set(0.5, 0.5);

        const paddingX = 10;
        const paddingY = 5;
        const minWidth = 100;

        this.healthWidth = Math.max(usernameText.width + paddingX * 2, minWidth);
        this.healthHeight = usernameText.height + paddingY * 2;

        // Create a container for the health bar
        const healthBarContainer = new Container();
        healthBarContainer.alpha = 0.5;
        textContainer.addChild(healthBarContainer);
        textContainer.addChild(usernameText);

        // Create background (grey/dark bar)
        //
        const healthBackground = new Graphics()
            .rect(
                -this.healthWidth / 2,
                -this.healthHeight / 2,
                this.healthWidth,
                this.healthHeight,
            )
            .fill(0x333333);

        // Create health bar (green bar)
        this.healthBar = new Graphics()
            .rect(
                -this.healthWidth / 2,
                -this.healthHeight / 2,
                this.healthWidth,
                this.healthHeight,
            )
            .fill(this.healthBarColour);

        healthBarContainer.addChild(healthBackground);
        healthBarContainer.addChild(this.healthBar);

        // Set initial position
        this.x = state.position.x;
        this.y = state.position.y;

        // Setup keyboard listeners
        this.setupKeyboardListeners();
    }

    updateHealthBar() {
        const healthPercentage = Math.max(0, Math.min(this.health / this.maxHealth, 1));
        const barWidth = this.healthWidth * healthPercentage;

        this.healthBar.clear();
        this.healthBar
            .rect(-this.healthWidth / 2, -this.healthHeight / 2, barWidth, this.healthHeight)
            .fill(this.healthBarColour);
    }

    spawnBolt(id: string, pos: Position, facing: Direction) {
        const bolt = new Bolt(this.id, id, this.assets, pos, facing);
        this.app.gameLayer.addChild(bolt);
        this.bolts.set(id, bolt);
        this.collisionSystem.addProjectile(bolt);
        if (this.id === this.collisionSystem.localPlayerId) {
            AudioSystem.getInstance().playSound("bolt");
        }
    }

    update(time: any, isLocal: boolean = false) {
        if (!this.alive) {
            return;
        }

        if (isLocal) {
            this.updateLocal(time);
            if (this.shooting) {
                const id = Date.now().toString(36);
                this.spawnBolt(id, { x: this.x, y: this.y }, this.facing);
                this.shooting = false;
            }
            if (this.app.bubble?.isPointOutside(this.x, this.y)) {
                this.health -= BUBBLE_DAMAGE;
            }
        } else {
            this.interpolate(Date.now());
        }

        this.bolts.forEach((bolt: Bolt) => {
            bolt.update(time, isLocal);
        });

        this.updateRotation();
        this.updateHealthBar();
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
        this.playerContainer.rotation = getRotationFromDirection(this.facing);
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
        }
    }

    takeForcedDamage(amount: number): void {
        this.health = Math.max(0, this.health - amount);
    }

    toPlayerState(): PlayerState {
        let bolts: BoltState[] = [];
        this.bolts.forEach((bolt: Bolt) => {
            bolts.push(bolt.toBoltState());
        });

        return {
            id: this.id,
            username: this.username,
            position: { x: this.x, y: this.y },
            facing: this.facing,
            health: this.health,
            bolts,
        };
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
