import { io, Socket } from "socket.io-client";
import { CharacterManager } from "./players/manager.js";
import { Direction, GameEvents, PlayerState, Position } from "./types.js";
import { showApp, showDNE, showPlayerPanel, showTooFull, updatePlayerPanel } from "./ui.js";
import { Application } from "pixi.js";

export class GameClient {
    private socket: Socket;
    private characterManager: CharacterManager;
    private roomId: string | null = null;
    private worldState: PlayerState[] = [];
    private roomSize: number = 0;
    private isSpectator: boolean = false;
    private app: Application;

    public gameState = "connection";

    constructor(app: Application, characterManager: CharacterManager) {
        this.characterManager = characterManager;
        this.app = app;
        const url = import.meta.env.PROD ? window.location.href : "http://localhost:5550";
        this.socket = io(url);
        this.setupSocketListeners();
    }

    public setCharacterManager(manager: CharacterManager): void {
        this.characterManager = manager;
    }

    private setupSocketListeners(): void {
        // this.socket.on(GameEvents.NEW_PLAYER, (data: any) => {
        //     console.log("User connected:", data);
        //     this.characterManager.createCharacter(data.id, data.position.x, data.position.y);
        // });

        this.socket.on(GameEvents.PLAYER_DISCONNECTED, (data: any) => {
            console.log("User disconnected:", data);
            this.characterManager.removeCharacter(data.id);
        });

        // this.socket.on(GameEvents.PLAYER_INITIALIZED, (data: any) => {
        //     console.log("Player init:", data);
        //
        //     this.characterManager.createCharacter(data.id, data.position.x, data.position.y, true);
        //
        //     data.players.forEach((player: any) => {
        //         this.characterManager.createCharacter(
        //             player.id,
        //             player.position.x,
        //             player.position.y,
        //         );
        //     });
        // });

        this.socket.on(GameEvents.WORLD_STATE, ({ state }: { state: PlayerState[] }) => {
            //this.characterManager.updateRemoteStates(data.state);
            this.worldState = state;
        });

        this.socket.on(GameEvents.PLAYER_DAMAGE, (data: any) => {
            if (!this.characterManager) return;

            const player = this.characterManager.getPlayer(data.targetId);
            if (player) {
                player.takeForcedDamage(data.amount);
            }
        });

        this.socket.on(
            GameEvents.JOIN_ROOM,
            ({ state, roomSize }: { state: PlayerState[]; roomSize: number }) => {
                this.worldState = state;
                this.roomSize = roomSize;
                this.gameState = "playerRoom";
                this.isSpectator = false;
                showPlayerPanel(this.worldState, roomSize, this);
            },
        );

        this.socket.on(
            GameEvents.JOIN_SPECTATOR,
            ({ state, roomSize }: { state: PlayerState[]; roomSize: number }) => {
                this.worldState = state;
                this.roomSize = roomSize;
                this.gameState = "playerRoom";
                this.isSpectator = true;
                showPlayerPanel(this.worldState, roomSize, this, true);
            },
        );

        this.socket.on(GameEvents.START_GAME, () => {
            console.log("get start_game");
            showApp();
            this.gameState = "playing";
            document.getElementById("pixi-container")!.appendChild(this.app.canvas);
        });

        this.socket.on(GameEvents.ROOM_DNE, () => {
            showDNE();
        });

        this.socket.on(GameEvents.ROOM_FULL, () => {
            showTooFull();
        });
    }

    public joinRoom(roomId: string, username: string): void {
        this.roomId = roomId;
        this.socket.emit(GameEvents.JOIN_ROOM, { roomId, username });
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
            amount: amount,
        });
    }

    public update(time: any): void {
        if (this.gameState == "playerRoom") {
            updatePlayerPanel(this.worldState, this.roomSize);
            return;
        } else if (this.gameState == "playing") {
            const localPlayer: { facing: Direction; position: Position } | null =
                this.characterManager.update(time);

            if (localPlayer == null) {
                return;
            }

            this.sendGameData(GameEvents.PLAYER_STATE, localPlayer);
        }
    }

    public disconnect(): void {
        this.socket.disconnect();
    }
}
