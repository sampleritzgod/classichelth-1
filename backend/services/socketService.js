import { Server } from "socket.io";

let io = null;

/**
 * Initialize Socket.IO server
 * @param {object} serverInstance - HTTP server instance
 * @param {Array<string>} allowedOrigins - CORS allowed origins
 */
export const initSocket = (serverInstance, allowedOrigins) => {
  io = new Server(serverInstance, {
    cors: {
      origin: allowedOrigins || "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room based on user ID
    socket.on("join", (userId) => {
      if (userId) {
        console.log(`[Socket.IO] Client ${socket.id} joined room: ${userId}`);
        socket.join(userId);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get Socket.IO instance
 * @returns {object} io instance
 */
export const getIO = () => {
  return io;
};

/**
 * Notify a specific user in real-time
 * @param {string} userId - Target user ID
 * @param {string} eventName - Socket event name
 * @param {object} data - Payload data
 */
export const notifyUser = (userId, eventName, data) => {
  if (io) {
    io.to(userId.toString()).emit(eventName, data);
    console.log(`[Socket.IO] Dispatched event "${eventName}" to user room ${userId}`);
  } else {
    console.warn(`[Socket.IO] Cannot emit "${eventName}". Socket.IO not initialized.`);
  }
};
