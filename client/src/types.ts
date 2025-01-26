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

export interface BoltState {
    id: string;
    position: Position;
    facing: Direction;
    alive: boolean;
}

export interface PlayerState {
    id: string;
    username: string;
    position: Position;
    facing: Direction;
    health: number;
    bolts: BoltState[];
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

export const GameEvents = {
    PLAYER_DISCONNECTED: "player_disconnected",
    WORLD_STATE: "world_state",
    PLAYER_STATE: "player_state",
    JOIN_ROOM: "join_room",
    ROOM_DNE: "room_dne",
    ROOM_FULL: "room_full",
    JOIN_SPECTATOR: "join_spectator",
    START_GAME: "start_game",
    PLAYER_DAMAGE: "player_damage",
    PLAYER_DEAD: "player_dead",
    BUBBLE_RADIUS: "bubble_radius",
    PLAYER_WIN: "player_win",
};
