import { Sprite } from "pixi.js";

export class Character extends Sprite {
  constructor(texture) {
    super(texture);

    // Set initial position
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;

    // Movement speed
    this.speed = 5;

    // Movement direction
    this.direction = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    // Set anchor point to center
    this.anchor.set(0.5);

    // Setup keyboard listeners
    this.setupKeyboardListeners();

    this.interpolationDelay = 100; // ms
    this.lastUpdate = new Map();
  }

  // Smooth position update with interpolation
  updateCharacterPosition(playerId, x, y) {
    const character = this.characters.get(playerId);
    if (character) {
      const now = Date.now();
      const lastUpdate = this.lastUpdate.get(playerId) || now;
      const deltaTime = now - lastUpdate;

      // Store target position
      character.targetX = x;
      character.targetY = y;

      // Calculate interpolation
      if (deltaTime < this.interpolationDelay) {
        const factor = deltaTime / this.interpolationDelay;
        character.x += (character.targetX - character.x) * factor;
        character.y += (character.targetY - character.y) * factor;
      } else {
        character.x = x;
        character.y = y;
      }

      this.lastUpdate.set(playerId, now);
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

  update(time) {
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
function keyboard(value) {
  const key = {
    value: value,
    isDown: false,
    isUp: true,
    press: undefined,
    release: undefined,
  };

  // Event handlers
  key.downHandler = (event) => {
    if (event.key === key.value) {
      if (key.isUp && key.press) {
        key.press();
      }
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };

  key.upHandler = (event) => {
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
