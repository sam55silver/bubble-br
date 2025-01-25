const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");

const MAP_SIZE = {
    width: 100,
    height: 100,
};

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
    GAME_STATE: "game_state",
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
        if (gameData.state) {
            playerPositions.set(socket.id, {
                x: gameData.state.x,
                y: gameData.state.y,
            });
        }

        // Broadcast the game state to all other users in the room
        socket.to(roomId).emit(GameEvents.GAME_STATE, {
            userId: socket.id,
            gameData: gameData,
        });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        // Remove user from all rooms
        rooms.forEach((users, roomId) => {
            if (users.has(socket.id)) {
                users.delete(socket.id);
                io.to(roomId).emit(GameEvents.PLAYER_DISCONNECTED, socket.id);

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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    http.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});
