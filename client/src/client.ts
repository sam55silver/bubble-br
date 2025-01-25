import { io, Socket } from "socket.io-client";
import { CharacterManager } from "./players/manager.js";

export const GameEvents = {
    PLAYER_INITIALIZED: "player_initialized",
    NEW_PLAYER: "new_player",
    PLAYER_DISCONNECTED: "player_disconnected",
    EXISTING_PLAYERS: "existing_players",
    WORLD_STATE: "world_state",
    PLAYER_MOVE: "player_move",
};

export class GameClient {
    private socket: Socket;
    private characterManager: CharacterManager;
    private roomId: string | null;

    constructor(characterManager: CharacterManager) {
        this.socket = io("http://localhost:3000");
        this.characterManager = characterManager;
        this.roomId = null;
        this.setupSocketListeners();
    }

    private setupSocketListeners(): void {
        this.socket.on(GameEvents.NEW_PLAYER, (data: any) => {
            console.log("User connected:", data);
            this.characterManager.createCharacter(data.id, data.position.x, data.position.y);
        });

        this.socket.on(GameEvents.PLAYER_DISCONNECTED, (data: any) => {
            console.log("User disconnected:", data);
            this.characterManager.removeCharacter(data.id);
        });

        this.socket.on(GameEvents.EXISTING_PLAYERS, (data: any) => {
            console.log("Existing users in room:", data);
            // users.forEach((userId: string) => {
            //     this.characterManager.createCharacter(userId);
            // });
        });

        this.socket.on(GameEvents.PLAYER_INITIALIZED, (data: any) => {
            console.log("Player init:", data);

            this.characterManager.createCharacter(data.id, data.position.x, data.position.y, true);

            data.players.forEach((player: any) => {
                this.characterManager.createCharacter(
                    player.id,
                    player.position.x,
                    player.position.y,
                );
            });
        });

        this.socket.on(GameEvents.WORLD_STATE, (data: any) => {
            console.log("New World state:", data);

            const localPlayerId = this.characterManager.localPlayer?.id;

            data.state.forEach((player: any) => {
                if (player.id == localPlayerId) {
                    return;
                }

                this.characterManager.updateCharacterPosition(
                    player.id,
                    player.position.x,
                    player.position.y,
                );
            });
        });
    }

    public joinRoom(roomId: string): void {
        this.roomId = roomId;
        this.socket.emit(GameEvents.PLAYER_INITIALIZED, roomId);
    }

    public sendGameData(event: any, data: any): void {
        this.socket.emit(event, {
            roomId: this.roomId,
            gameData: data,
        });
    }

    public update(time: any): void {
        const localPlayer = this.characterManager.localPlayer;

        if (!localPlayer) {
            return;
        }

        localPlayer.updateLocal(time);
        this.sendGameData(GameEvents.PLAYER_MOVE, {
            position: { x: localPlayer.x, y: localPlayer.y },
        });
    }

    public disconnect(): void {
        this.socket.disconnect();
    }
}
