import { io, Socket } from "socket.io-client";
import { CharacterManager } from "./players/manager.js";
import { Direction, Position } from "./types.js";

export const GameEvents = {
    PLAYER_INITIALIZED: "player_initialized",
    NEW_PLAYER: "new_player",
    PLAYER_DISCONNECTED: "player_disconnected",
    EXISTING_PLAYERS: "existing_players",
    WORLD_STATE: "world_state",
    PLAYER_STATE: "player_state",
    PLAYER_DAMAGE: "player_damage",
};

export class GameClient {
    private socket: Socket;
    private characterManager: CharacterManager;
    private roomId: string | null;

    constructor(characterManager: CharacterManager) {
        const url = import.meta.env.PROD ? window.location.href : "http://localhost:5550";
        console.log(url);
        this.socket = io(url);
        this.characterManager = characterManager;
        this.roomId = null;
        this.setupSocketListeners();
    }

    public setCharacterManager(manager: CharacterManager): void {
        this.characterManager = manager;
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
            this.characterManager.updateRemoteStates(data.state);
        });

        this.socket.on(GameEvents.PLAYER_DAMAGE, (data: any) => {
            if (!this.characterManager) return;
            
            const player = this.characterManager.getPlayer(data.targetId);
            if (player) {
                player.takeForcedDamage(data.amount);
            }
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

    public sendDamage(targetId: string, amount: number): void {
        this.socket.emit(GameEvents.PLAYER_DAMAGE, {
            roomId: this.roomId,
            targetId: targetId,
            amount: amount
        });
    }
    
    public update(time: any): void {
        const localPlayer: { facing: Direction; position: Position } | null =
            this.characterManager.update(time);

        if (localPlayer == null) {
            return;
        }

        this.sendGameData(GameEvents.PLAYER_STATE, localPlayer);
    }

    public disconnect(): void {
        this.socket.disconnect();
    }
}
