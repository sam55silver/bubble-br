import { Direction } from "./types";

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
