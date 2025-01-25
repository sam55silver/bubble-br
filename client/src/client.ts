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
            //this.characterManager.createCharacter(userId);
        });

        this.socket.on(GameEvents.PLAYER_DISCONNECTED, (data: any) => {
            console.log("User disconnected:", data);
            //this.characterManager.removeCharacter(userId);
        });

        this.socket.on(GameEvents.EXISTING_PLAYERS, (data: any) => {
            console.log("Existing users in room:", data);
            // users.forEach((userId: string) => {
            //     this.characterManager.createCharacter(userId);
            // });
        });

        this.socket.on(GameEvents.PLAYER_INITIALIZED, (data: any) => {
            console.log("Player init:", data);

            this.characterManager.createCharacter(
                data.id,
                data.ownPosition.x,
                data.ownPosition.y,
                true,
            );
        });

        this.socket.on(GameEvents.GAME_STATE, (data: any) => {
            console.log("New Game state:", data);
        });
    }

    public joinRoom(roomId: string): void {
        this.roomId = roomId;
        this.socket.emit(GameEvents.PLAYER_INITIALIZED, roomId);
    }

    public sendGameData(event: any, data: GameData): void {
        this.socket.emit(event, {
            roomId: this.roomId,
            gameData: data,
        } as EmitGameData);
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
        if (this.characterManager.localPlayer) {
            this.characterManager.localPlayer.updateLocal(time);
        }
    }

    public disconnect(): void {
        this.socket.disconnect();
    }
}
