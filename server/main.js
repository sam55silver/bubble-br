const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");

const MAP_SIZE = {
    width: 2500,
    height: 2500,
};

const SPAWN_PADDING = 80;

const TICK_RATE = 60;
const TICK_INTERVAL = 1000 / TICK_RATE;

const PLAYER_LIMIT = 12;
const PLAYER_MAX_HEALTH = 100;

const BUBBLE_SHRINK_SPEED = 10;
const BUBBLE_INTERVAL = 50;
const BUBBLE_RADIUS = 1800;

const MAX_TICK = 100000;

const corsSettings = {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
};

const GameEvents = {
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

const io = new Server(http, corsSettings);

// Map of rooms, where each room contains a Map of player states
// rooms: Map<roomId, Map<playerId, playerState>>
const rooms = new Map();
const bubbles = new Map();
const roomsState = new Map();

let tickCount = 0;

function generateRandomPosition() {
    return {
        x: Math.floor(Math.random() * (MAP_SIZE.width - 2 * SPAWN_PADDING) + SPAWN_PADDING),
        y: Math.floor(Math.random() * (MAP_SIZE.height - 2 * SPAWN_PADDING) + SPAWN_PADDING),
    };
}

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on(GameEvents.JOIN_ROOM, ({ roomId, username }) => {
        console.log(`Socket ${socket.id} joining room ${roomId}`);

        // Create room if it doesn't exist
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
            roomsState.set(roomId, "title");
        }

        const world = rooms.get(roomId);

        if (world.size >= PLAYER_LIMIT) {
            socket.emit(GameEvents.ROOM_FULL, { players: world.size });
            return;
        }

        const initialState = {
            id: socket.id,
            username,
            position: generateRandomPosition(),
            facing: "south",
            health: PLAYER_MAX_HEALTH,
            bolts: [],
        };

        socket.join(roomId);

        // Add player to room
        world.set(socket.id, initialState);
        worldState = Array.from(world.values());

        socket.emit(GameEvents.JOIN_ROOM, { state: worldState, roomSize: PLAYER_LIMIT });
    });

    socket.on(GameEvents.PLAYER_STATE, (data) => {
        const { roomId, gameData } = data;
        const roomPlayers = rooms.get(roomId);

        if (roomPlayers && roomPlayers.has(socket.id)) {
            // Update the entire player state
            const updatedState = {
                ...gameData,
                id: socket.id, // Ensure the ID stays correct
            };

            // Update the player state in the room
            roomPlayers.set(socket.id, updatedState);
        }
    });

    socket.on(GameEvents.START_GAME, ({ roomId }) => {
        const world = rooms.get(roomId);
        if (world) {
            roomsState.set(roomId, "playing");
            bubbles.set(roomId, BUBBLE_RADIUS);
            io.to(roomId).emit(GameEvents.START_GAME, {
                state: Array.from(world.values()),
                radius: BUBBLE_RADIUS,
            });
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        // Remove player from their room
        rooms.forEach((players, roomId) => {
            if (players.has(socket.id)) {
                players.delete(socket.id);
                io.to(roomId).emit(GameEvents.PLAYER_DISCONNECTED, { id: socket.id });
            }
        });
    });

    socket.on("error", (error) => {
        console.error("Socket error:", error);
    });

    socket.on(GameEvents.PLAYER_DAMAGE, (data) => {
        const { roomId, targetId, amount } = data;
        const roomPlayers = rooms.get(roomId);

        if (roomPlayers && roomPlayers.has(targetId)) {
            const targetPlayer = roomPlayers.get(targetId);
            const health = targetPlayer.health - amount;
            targetPlayer.health = Math.max(0, health);
        }
    });
});

function serverTick() {
    tickCount++;

    rooms.forEach((players, roomId) => {
        if (players.size == 1 && roomsState.get(roomId) == "playing") {
            io.to(roomId).emit(GameEvents.PLAYER_WIN);
            io.socketsLeave(roomId);
            rooms.delete(roomId);
            bubbles.delete(roomId);
            roomsState.delete(roomId);
            return;
        }

        if (players.size > 0) {
            // Convert players Map to array for world state
            const worldState = Array.from(players.values());

            worldState.forEach((state) => {
                if (state.health <= 0) {
                    players.delete(state.id);
                    io.to(roomId).emit(GameEvents.PLAYER_DEAD, { id: state.id });
                    io.in(state.id).socketsLeave(roomId);
                }
            });

            if (tickCount % BUBBLE_INTERVAL === 0) {
                const radius = (bubbles.get(roomId) || BUBBLE_RADIUS) - BUBBLE_SHRINK_SPEED;
                bubbles.set(roomId, radius);
                io.to(roomId).emit(GameEvents.BUBBLE_RADIUS, {
                    radius,
                });
            }

            io.to(roomId).emit(GameEvents.WORLD_STATE, { state: worldState });
        }
    });

    if (tickCount > MAX_TICK) {
        tickCount = 0;
    }
}

const tickInterval = setInterval(serverTick, TICK_INTERVAL);

app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5550;
http.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    clearInterval(tickInterval);
    http.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});
