const express = require("express");
const app = express();
const http = require("http").createServer(app);
const cors = require("cors");
const { Server } = require("socket.io");

const corsSettings = {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
};

const io = new Server(http, corsSettings);

// Serve static files
app.use(express.static("public"));

// Store active rooms and their participants
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle room joining
  socket.on("join-room", (roomId) => {
    console.log(`Socket ${socket.id} joining room ${roomId}`);

    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    // Add user to room
    rooms.get(roomId).add(socket.id);
    socket.join(roomId);

    // Notify other users in the room
    socket.to(roomId).emit("user-connected", socket.id);

    // Send list of existing users to the new participant
    const usersInRoom = Array.from(rooms.get(roomId)).filter(
      (id) => id !== socket.id,
    );
    socket.emit("users-in-room", usersInRoom);
  });

  // Handle WebRTC signaling
  socket.on("offer", (data) => {
    console.log(`Received offer from ${socket.id} to ${data.target}`);
    io.to(data.target).emit("offer", {
      offer: data.offer,
      from: socket.id,
    });
  });

  socket.on("answer", (data) => {
    console.log(`Received answer from ${socket.id} to ${data.target}`);
    io.to(data.target).emit("answer", {
      answer: data.answer,
      from: socket.id,
    });
  });

  socket.on("ice-candidate", (data) => {
    console.log(`Received ICE candidate from ${socket.id} to ${data.target}`);
    io.to(data.target).emit("ice-candidate", {
      candidate: data.candidate,
      from: socket.id,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove user from all rooms
    rooms.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        io.to(roomId).emit("user-disconnected", socket.id);

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
