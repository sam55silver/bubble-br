const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");

const MAP_SIZE = {
    width: 800,
    height: 700,
};

const TICK_RATE = 60; // Number of ticks per second
const TICK_INTERVAL = 1000 / TICK_RATE; // Milliseconds between ticks

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
    PLAYER_MOVE: "player_move",
};

const io = new Server(http, corsSettings);

// Store active rooms and their participants with their positions
const rooms = new Map();
const playerPositions = new Map();

// Generate random position within map bounds
function generateRandomPosition() {
    return {
        x: Math.floor(Math.random() * MAP_SIZE.width),
        y: Math.floor(Math.random() * MAP_SIZE.height),
    };
}

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Handle room joining
    socket.on(GameEvents.PLAYER_INITIALIZED, (roomId) => {
        console.log(`Socket ${socket.id} joining room ${roomId}`);

        // Create room if it doesn't exist
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }

        // Generate random position for new player
        const initialPosition = generateRandomPosition();
        playerPositions.set(socket.id, initialPosition);

        // Add user to room
        rooms.get(roomId).add(socket.id);
        socket.join(roomId);

        // Notify other users in the room about new player with position
        socket.to(roomId).emit(GameEvents.NEW_PLAYER, {
            id: socket.id,
            position: initialPosition,
        });

        // Send list of existing users with their positions to the new participant
        const usersInRoom = Array.from(rooms.get(roomId))
            .filter((id) => id !== socket.id)
            .map((id) => ({
                id,
                position: playerPositions.get(id),
            }));

        socket.emit(GameEvents.PLAYER_INITIALIZED, {
            id: socket.id,
            position: initialPosition,
            players: usersInRoom,
        });
    });

    // Handle game state updates
    socket.on(GameEvents.PLAYER_MOVE, (data) => {
        const { roomId, gameData } = data;

        // Update stored position
        if (gameData.position) {
            playerPositions.set(socket.id, {
                x: gameData.position.x,
                y: gameData.position.y,
            });
        }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        // Remove user from all rooms
        rooms.forEach((users, roomId) => {
            if (users.has(socket.id)) {
                users.delete(socket.id);
                io.to(roomId).emit(GameEvents.PLAYER_DISCONNECTED, { id: socket.id });

                // Remove player position
                playerPositions.delete(socket.id);

                // Remove room if empty
                if (users.size === 0) {
                    rooms.delete(roomId);
                }
            }
        });
    });

    // Error handling
    socket.on("error", (error) => {
        console.error("Socket error:", error);
    });
});

// Server tick function
function serverTick() {
    // Process each room
    rooms.forEach((users, roomId) => {
        if (users.size > 0) {
            // Gather all player positions for this room
            const worldState = Array.from(users).map((playerId) => ({
                id: playerId,
                position: playerPositions.get(playerId),
            }));

            // Broadcast world state to all players in the room
            io.to(roomId).emit(GameEvents.WORLD_STATE, { state: worldState });
        }
    });
}

// Start the server tick
const tickInterval = setInterval(serverTick, TICK_INTERVAL);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal Server Error" });
});

app.get("/", (req, res) => {
    res.send("Hello World");
});

const PORT = process.env.PORT || 5550;
http.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    clearInterval(tickInterval);
    http.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});
