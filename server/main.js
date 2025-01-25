const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");

const MAP_SIZE = {
    width: 800,
    height: 700,
};

const TICK_RATE = 60;
const TICK_INTERVAL = 1000 / TICK_RATE;

const corsSettings = {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
};

const GameEvents = {
    PLAYER_INITIALIZED: "player_initialized",
    NEW_PLAYER: "new_player",
    PLAYER_DISCONNECTED: "player_disconnected",
    EXISTING_PLAYERS: "existing_players",
    WORLD_STATE: "world_state",
    PLAYER_STATE: "player_state", // Changed from PLAYER_MOVE
};

const io = new Server(http, corsSettings);

// Map of rooms, where each room contains a Map of player states
// rooms: Map<roomId, Map<playerId, playerState>>
const rooms = new Map();

function generateRandomPosition() {
    return {
        x: Math.floor(Math.random() * MAP_SIZE.width),
        y: Math.floor(Math.random() * MAP_SIZE.height),
    };
}

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on(GameEvents.PLAYER_INITIALIZED, (roomId) => {
        console.log(`Socket ${socket.id} joining room ${roomId}`);

        // Create room if it doesn't exist
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
        }

        const roomPlayers = rooms.get(roomId);

        // Create initial player state
        const initialState = {
            id: socket.id,
            position: generateRandomPosition(),
            facing: "south",
            health: 100,
        };

        // Add player to room
        roomPlayers.set(socket.id, initialState);
        socket.join(roomId);

        // Notify other users in the room about new player
        socket.to(roomId).emit(GameEvents.NEW_PLAYER, initialState);

        // Send list of existing players to the new participant
        const existingPlayers = Array.from(roomPlayers.entries())
            .filter(([id]) => id !== socket.id)
            .map(([_, state]) => state);

        socket.emit(GameEvents.PLAYER_INITIALIZED, {
            ...initialState,
            players: existingPlayers,
        });
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

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        // Remove player from their room
        rooms.forEach((players, roomId) => {
            if (players.has(socket.id)) {
                players.delete(socket.id);
                io.to(roomId).emit(GameEvents.PLAYER_DISCONNECTED, { id: socket.id });

                // Remove room if empty
                if (players.size === 0) {
                    rooms.delete(roomId);
                }
            }
        });
    });

    socket.on("error", (error) => {
        console.error("Socket error:", error);
    });
});

function serverTick() {
    rooms.forEach((players, roomId) => {
        if (players.size > 0) {
            // Convert players Map to array for world state
            const worldState = Array.from(players.values());
            io.to(roomId).emit(GameEvents.WORLD_STATE, { state: worldState });
        }
    });
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
