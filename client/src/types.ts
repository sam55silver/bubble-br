export interface PlayerData {
    id: string;
    username: string;
    x: number;
    y: number;
}

export interface GameStateUpdate {
    userId: string;
    gameData: GameData;
}

export interface GameData {
    type: string;
    state?: {
        x: number;
        y: number;
    };
    [key: string]: any; // For additional game-specific data
}

export interface RoomJoinData {
    roomId: string;
    username: string;
}

export interface PlayerMovedData {
    userId: string;
    position: {
        x: number;
        y: number;
    };
}

export interface Position {
    x: number;
    y: number;
}

export interface PlayerState {
    id: string;
    username: string;
    position: Position;
    facing: Direction;
    health: number;
}

export enum Direction {
    NORTH = "north",
    NORTHEAST = "northeast",
    EAST = "east",
    SOUTHEAST = "southeast",
    SOUTH = "south",
    SOUTHWEST = "southwest",
    WEST = "west",
    NORTHWEST = "northwest",
}
