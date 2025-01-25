import { Sprite, Texture } from "pixi.js";

export class Character extends Sprite {
    id: string;
    speed: number = 5;
    direction = {
        up: false,
        down: false,
        left: false,
        right: false,
    };
    interpolationDelay = 100; // ms
    lastUpdate?: number = undefined;
    targetX = 0;
    targetY = 0;

    constructor(id: string, playerTexture: Texture, x: number, y: number) {
        super(playerTexture);

        this.id = id;

        // Set initial position
        this.x = x;
        this.y = y;

        // Set anchor point to center
        this.anchor.set(0.5);

        // Setup keyboard listeners
        this.setupKeyboardListeners();
    }

    // Smooth position update with interpolation
    updatePosition(x: number, y: number) {
        const now = Date.now();
        const lastUpdate = this.lastUpdate || now;
        const deltaTime = now - lastUpdate;

        // Store target position
        this.targetY = y;
        this.targetX = x;

        // Calculate interpolation
        if (deltaTime < this.interpolationDelay) {
            const factor = deltaTime / this.interpolationDelay;
            this.x += (this.targetX - this.x) * factor;
            this.y += (this.targetY - this.y) * factor;
        } else {
            this.x = x;
            this.y = y;
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
