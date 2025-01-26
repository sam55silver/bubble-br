import { io, Socket } from "socket.io-client";
import { CharacterManager } from "./players/manager.js";
import { GameEvents, PlayerState } from "./types.js";
import { showApp, showDNE, showPlayerPanel, showTooFull, updatePlayerPanel } from "./ui.js";
import { AudioSystem } from "./audio/audio.js";
import { BOLT_DAMAGE, GameApp } from "./common.js";
import { Character } from "./players/character.js";

export class GameClient {
    private socket: Socket;
    private characterManager: CharacterManager;
    private roomId: string | null = null;
    private worldState: PlayerState[] = [];
    private roomSize: number = 0;
    private app: GameApp;

    public gameState = "connection";
    public localPlayerId: string | null = null;

    constructor(app: GameApp, characterManager: CharacterManager) {
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
        this.socket.on(GameEvents.PLAYER_DISCONNECTED, (data: any) => {
            console.log("User disconnected:", data);
            this.characterManager.removeCharacter(data.id);
        });

        this.socket.on(GameEvents.WORLD_STATE, ({ state }: { state: PlayerState[] }) => {
            this.worldState = state;
            this.characterManager.updateRemoteStates(state);
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
                showPlayerPanel(
                    this.worldState,
                    roomSize,
                    this,
                    import.meta.env.DEV ? true : false,
                );
            },
        );

        this.socket.on(
            GameEvents.JOIN_SPECTATOR,
            ({ state, roomSize }: { state: PlayerState[]; roomSize: number }) => {
                this.worldState = state;
                this.roomSize = roomSize;
                this.gameState = "playerRoom";
                showPlayerPanel(this.worldState, roomSize, this, true);
            },
        );

        this.socket.on(GameEvents.START_GAME, ({ state }: { state: PlayerState[] }) => {
            showApp();
            this.gameState = "playing";
            this.worldState = state;
            document.getElementById("pixi-container")!.appendChild(this.app.canvas);
            this.localPlayerId = this.socket.id || null;
            this.characterManager.localPlayerId = this.localPlayerId;
            this.characterManager.collisionSystem.localPlayerId = this.localPlayerId;

            state.forEach((player: PlayerState) => {
                this.characterManager.createCharacter(player);
            });
        });

        this.socket.on(GameEvents.ROOM_DNE, () => {
            showDNE();
        });

        this.socket.on(GameEvents.ROOM_FULL, () => {
            showTooFull();
        });

        this.socket.on(GameEvents.PLAYER_DEAD, ({ id }: { id: string }) => {
            this.characterManager.removeCharacter(id);
        });
    }

    public joinRoom(roomId: string, username: string): void {
        this.roomId = roomId;
        this.socket.emit(GameEvents.JOIN_ROOM, { roomId, username });
    }

    public sendGameData(event: any, data: any): void {
        if (this.socket) {
            this.socket.emit(event, {
                roomId: this.roomId,
                gameData: data,
            });
        }
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
            this.characterManager.update(time);

            if (this.localPlayerId == null) {
                return;
            }

            const localPlayer = this.characterManager.players.get(this.localPlayerId);
            if (localPlayer) {
                this.sendGameData(GameEvents.PLAYER_STATE, localPlayer.toPlayerState());
            }

            this.characterManager.charsHit.forEach((player: Character) => {
                this.sendDamage(player.id, BOLT_DAMAGE);
            });
            this.characterManager.charsHit = [];
        }
    }

    public disconnect(): void {
        this.socket.disconnect();
    }
}
