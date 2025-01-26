import { Container, Rectangle, Sprite } from "pixi.js";
import { Character } from "../players/character";
import { Bolt } from "../players/bolt";

export class CollisionSystem {
    private characters: Set<Character>;
    private projectiles: Set<Container>;

    constructor() {
        this.characters = new Set();
        this.projectiles = new Set();
    }

    addCharacter(character: Character) {
        this.characters.add(character);
    }

    removeCharacter(character: Character) {
        this.characters.delete(character);
    }

    addProjectile(projectile: Container) {
        this.projectiles.add(projectile);
    }

    removeProjectile(projectile: Sprite) {
        this.projectiles.delete(projectile);
    }

    update(time: any) {
        this.projectiles = new Set(
            Array.from(this.projectiles).filter((projectile) => {
                if (projectile instanceof Bolt && !projectile.isAlive()) {
                    return false;
                }
                return true;
            }),
        );

        // Check character-projectile collisions
        for (const character of this.characters) {
            for (const projectile of this.projectiles) {
                if (this.checkCharacterProjectileCollision(character, projectile)) {
                    this.handleCharacterProjectileCollision(character, projectile);
                }
            }
        }

        const charactersArray = Array.from(this.characters);
        for (let i = 0; i < charactersArray.length; i++) {
            for (let j = i + 1; j < charactersArray.length; j++) {
                const char1 = charactersArray[i];
                const char2 = charactersArray[j];

                if (this.checkCharacterCollision(char1, char2)) {
                    this.handleCharacterCollision(char1, char2);
                }
            }
        }
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

    private checkCharacterProjectileCollision(character: Character, projectile: Container): boolean {
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

        if (char1.isLocal) {
            char1.x -= Math.cos(angle) * pushDistance;
            char1.y -= Math.sin(angle) * pushDistance;
        }
        if (char2.isLocal) {
            char2.x += Math.cos(angle) * pushDistance;
            char2.y += Math.sin(angle) * pushDistance;
        }
    }

    private handleCharacterProjectileCollision(character: Character, projectile: Container): void {
        if (projectile instanceof Bolt && character.id === projectile.shooterId) {
            return;
        }
        console.log(`Collision detected between Character and Projectile`);
        character.tint = 0xff0000;
        character.takeDamage(10);

        if (projectile instanceof Bolt) {
            // send damage to server
            
            projectile.destroy();
        }

        setTimeout(() => {
            character.tint = 0xffffff;
        }, 500);
    }
}
