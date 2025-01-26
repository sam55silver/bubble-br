import { Sprite, Texture, Text, Container, Graphics } from "pixi.js";
import { BoltState, Direction, PlayerState, Position } from "../types";
import { GameApp, getRotationFromDirection, RemoteContainer } from "../common";
import { Bolt } from "./bolt";

export class Character extends RemoteContainer {
    speed: number = 5;
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
    health: number;
    bolts: Map<string, Bolt> = new Map();
    app: GameApp;
    assets: Record<string, Texture>;
    playerContainer: Container;

    constructor(app: GameApp, state: PlayerState, assets: Record<string, Texture>) {
        super();
        this.app = app;
        this.assets = assets;
        this.id = state.id;
        this.username = state.username;
        this.facing = state.facing;
        this.health = state.health;

        this.zIndex = 2;

        this.playerContainer = new Container();
        this.addChild(this.playerContainer);

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
        this.addChild(textContainer);

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

        const paddingX = 10; // Padding around the text
        const paddingY = 6; // Padding around the text
        const background = new Graphics()
            .rect(
                -usernameText.width / 2 - paddingX,
                -usernameText.height / 2 - paddingY,
                usernameText.width + paddingX * 2,
                usernameText.height + paddingY * 2,
            )
            .fill(0x000000);
        background.alpha = 0.5;
        textContainer.addChild(background);
        textContainer.addChild(usernameText);

        // Set initial position
        this.x = state.position.x;
        this.y = state.position.y;

        // Setup keyboard listeners
        this.setupKeyboardListeners();
    }

    spawnBolt(id: string, pos: Position, facing: Direction) {
        const bolt = new Bolt(id, this.assets, pos, facing);
        this.app.gameView.addChild(bolt);
        this.bolts.set(id, bolt);
    }

    update(time: any, isLocal: boolean = false) {
        if (isLocal) {
            this.updateLocal(time);
            if (this.shooting) {
                const id = Date.now().toString(36);
                this.spawnBolt(id, { x: this.x, y: this.y }, this.facing);
                this.shooting = false;
            }
        } else {
            this.interpolate(Date.now());
        }

        this.bolts.forEach((bolt: Bolt) => {
            bolt.update(time, isLocal);
        });

        this.updateRotation();
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
