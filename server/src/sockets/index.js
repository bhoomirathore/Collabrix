import { Server } from "socket.io";
import User from "../models/User.js";

const initSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
  });

  io.on("connection", (socket) => {
    let currentRoom = null;
    let currentUser = null;

    console.log("🔌 Sockets: User connected:", socket.id);

    // Join a specific workspace room
    socket.on("join-workspace", ({ workspaceId, user }) => {
      if (currentRoom) {
        socket.leave(currentRoom);
      }
      
      currentRoom = `workspace:${workspaceId}`;
      socket.join(currentRoom);
      currentUser = user;
      
      console.log(`👥 Sockets: User ${user?.name || socket.id} joined room ${currentRoom}`);
      
      // Update user presence status to online when connecting
      if (user && user.id) {
        User.findByIdAndUpdate(user.id, { status: "online" }).then(() => {
          io.to(currentRoom).emit("user-presence-update", {
            userId: user.id,
            status: "online"
          });
        }).catch(err => console.error("Presence error:", err.message));
      }
    });

    // Handle user presence status shifts (online, away, busy, offline)
    socket.on("change-presence", async ({ userId, status, customStatus }) => {
      try {
        await User.findByIdAndUpdate(userId, { status, customStatus });
        if (currentRoom) {
          io.to(currentRoom).emit("user-presence-update", {
            userId,
            status,
            customStatus
          });
        }
      } catch (err) {
        console.error("Change presence socket error:", err.message);
      }
    });

    // Handle typing state declarations
    socket.on("typing", ({ isTyping }) => {
      if (currentRoom && currentUser) {
        socket.to(currentRoom).emit("typing-state", {
          user: currentUser,
          isTyping
        });
      }
    });

    // Real-time chat message broadcast
    socket.on("send-message", (message) => {
      if (currentRoom) {
        socket.to(currentRoom).emit("receive-message", message);
      }
    });

    // Real-time emoji reaction broadcast
    socket.on("message-reaction", (message) => {
      if (currentRoom) {
        io.to(currentRoom).emit("update-message", message);
      }
    });

    // Real-time Kanban board task movements
    socket.on("task-moved", (task) => {
      if (currentRoom) {
        socket.to(currentRoom).emit("task-updated", task);
      }
    });

    // Real-time Engineer's Space timeline updates
    socket.on("log-event", (event) => {
      if (currentRoom) {
        socket.to(currentRoom).emit("receive-event", event);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Sockets: User disconnected:", socket.id);
      
      // Toggle user status to away when disconnecting
      if (currentUser && currentUser.id && currentRoom) {
        User.findByIdAndUpdate(currentUser.id, { status: "away" }).then(() => {
          io.to(currentRoom).emit("user-presence-update", {
            userId: currentUser.id,
            status: "away"
          });
        }).catch(err => console.error("Disconnect presence error:", err.message));
      }
    });
  });
};

export default initSockets;