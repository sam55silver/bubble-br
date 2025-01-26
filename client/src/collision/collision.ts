import { Container, Rectangle } from "pixi.js";
import { Character } from "../players/character";
import { Bolt } from "../players/bolt";
import { BOLT_DAMAGE } from "../common";

export class CollisionSystem {
    private characters: Map<string, Character>;
    private projectiles: Set<Bolt>;

    public localPlayerId: string | null = null;

    constructor() {
        this.characters = new Map();
        this.projectiles = new Set();
    }

    isLocal(character: Character): boolean {
        return this.localPlayerId == character.id;
    }

    addCharacter(character: Character) {
        this.characters.set(character.id, character);
    }

    removeCharacter(character: Character) {
        this.characters.delete(character.id);
    }

    addProjectile(projectile: Bolt) {
        this.projectiles.add(projectile);
    }

    removeProjectile(projectile: Bolt) {
        projectile.alive = false;
        this.projectiles.delete(projectile);
        projectile.boltSprite.destroy();
    }

    update(): Character[] {
        this.projectiles = new Set(
            Array.from(this.projectiles).filter((projectile) => {
                if (projectile instanceof Bolt && !projectile.isAlive()) {
                    return false;
                }
                return true;
            }),
        );

        // Check character-projectile collisions
        let charsHit = [];
        for (const character of this.characters.values()) {
            for (const projectile of this.projectiles) {
                if (this.checkCharacterProjectileCollision(character, projectile)) {
                    const hit = this.handleCharacterProjectileCollision(character, projectile);
                    if (hit != null) {
                        charsHit.push(hit);
                    }
                }
            }
        }

        const charactersArray = Array.from(this.characters.values());
        for (let i = 0; i < charactersArray.length; i++) {
            for (let j = i + 1; j < charactersArray.length; j++) {
                const char1 = charactersArray[i];
                const char2 = charactersArray[j];

                if (this.checkCharacterCollision(char1, char2)) {
                    this.handleCharacterCollision(char1, char2);
                }
            }
        }

        return charsHit;
    }

    private getCharacterBounds(character: Character): Rectangle {
        const bounds = character.getBounds();
        const widthShrinkFactor = 0.25;
        const heightShrinkFactor = 0.4;

        const newWidth = bounds.width * widthShrinkFactor;
        const newHeight = bounds.height * heightShrinkFactor;
        const newX = character.x - newWidth / 2;
        const newY = character.y - newHeight / 2;

        return new Rectangle(newX, newY, newWidth, newHeight);
    }

    private getProjectileBounds(projectile: Container): Rectangle | null {
        if (projectile instanceof Bolt && !projectile.isAlive()) {
            return null;
        }

        try {
            const bounds = projectile.getBounds();
            const widthShrinkFactor = 0.25;
            const heightShrinkFactor = 0.4;

            const newWidth = bounds.width * widthShrinkFactor;
            const newHeight = bounds.height * heightShrinkFactor;
            const newX = projectile.x - newWidth / 2;
            const newY = projectile.y - newHeight / 2;

            return new Rectangle(newX, newY, newWidth, newHeight);
        } catch (e) {
            return null;
        }
    }

    private checkCollision(a: Rectangle, b: Rectangle): boolean {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    private checkCharacterCollision(char1: Character, char2: Character): boolean {
        const bounds1 = this.getCharacterBounds(char1);
        const bounds2 = this.getCharacterBounds(char2);
        return this.checkCollision(bounds1, bounds2);
    }

    private checkCharacterProjectileCollision(character: Character, projectile: Bolt): boolean {
        const charBounds = this.getCharacterBounds(character);
        const projectileBounds = this.getProjectileBounds(projectile);
        if (!projectileBounds) {
            return false;
        }
        return this.checkCollision(charBounds, projectileBounds);
    }

    private handleCharacterCollision(char1: Character, char2: Character): void {
        const dx = char2.x - char1.x;
        const dy = char2.y - char1.y;
        const angle = Math.atan2(dy, dx);
        const pushDistance = 5;

        console.log(`Collision detected between Characters`);

        if (this.isLocal(char1)) {
            char1.x -= Math.cos(angle) * pushDistance;
            char1.y -= Math.sin(angle) * pushDistance;
        }
        if (this.isLocal(char2)) {
            char2.x += Math.cos(angle) * pushDistance;
            char2.y += Math.sin(angle) * pushDistance;
        }
    }

    private handleCharacterProjectileCollision(
        character: Character,
        projectile: Bolt,
    ): Character | null {
        if (projectile instanceof Bolt && character.id === projectile.playerId) {
            return null;
        }
        console.log(`Collision detected between Character and Projectile`);
        character.tint = 0xff0000;
        character.takeDamage(BOLT_DAMAGE);

        if (projectile instanceof Bolt) {
            this.removeProjectile(projectile);
        }

        setTimeout(() => {
            character.tint = 0xffffff;
        }, 500);
        return character;
    }
}
