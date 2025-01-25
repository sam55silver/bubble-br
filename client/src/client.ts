import { io, Socket } from "socket.io-client";
import { GameEvents } from "../../lib.js";
import { CharacterManager } from "./players/manager.js";

interface GameData {
    type: string;
    state?: {
        x: number;
        y: number;
    };
}

interface GameStateUpdate {
    userId: string;
    gameData: GameData;
}

interface EmitGameData {
    roomId: string;
    gameData: GameData;
}

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

        this.socket.on(GameEvents.GAME_STATE, (data: any) => {
            console.log("New Game state:", data);
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

    private handleGameData(userId: string, gameData: GameData): void {
        console.log("Receiving game data:", gameData);

        switch (gameData.type) {
            case "character_update":
                if (gameData.state) {
                    const { x, y } = gameData.state;

                    // Create character if it doesn't exist
                    if (!this.characterManager.characters.get(userId)) {
                        this.characterManager.createCharacter(userId);
                    }

                    // Update position
                    this.characterManager.updateCharacterPosition(userId, x, y);
                }
                break;
            // Add other game state handling cases here
        }
    }

    public update(time: any): void {
        const localPlayer = this.characterManager.localPlayer;
        if (localPlayer != null) {
            localPlayer.updateLocal(time);
            this.sendGameData(GameEvents.PLAYER_MOVE, {
                position: { x: localPlayer.x, y: localPlayer.y },
            });
        }
    }

    public disconnect(): void {
        this.socket.disconnect();
    }
}
