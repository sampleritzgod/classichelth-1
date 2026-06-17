import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

/**
 * Extract a JWT from the socket handshake (auth payload, query, or cookie).
 */
const extractHandshakeToken = (socket) => {
  const { auth, query, headers } = socket.handshake;
  if (auth && typeof auth.token === "string" && auth.token) return auth.token;
  if (query && typeof query.token === "string" && query.token) return query.token;

  const cookieHeader = headers?.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
};

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

  // Authenticate every socket connection. A verified user id is bound to the
  // socket so a client can only ever join its own private room.
  io.use((socket, next) => {
    try {
      const token = extractHandshakeToken(socket);
      if (!token) {
        return next(new Error("Authentication required"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      return next();
    } catch (err) {
      return next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket) => {
    // Automatically join the authenticated user's own room. The legacy "join"
    // event is honored only when it matches the authenticated identity, so a
    // client can never subscribe to another user's notifications.
    if (socket.userId) {
      socket.join(socket.userId.toString());
    }

    socket.on("join", (requestedUserId) => {
      if (
        requestedUserId &&
        socket.userId &&
        requestedUserId.toString() === socket.userId.toString()
      ) {
        socket.join(socket.userId.toString());
      }
    });

    socket.on("disconnect", () => {});
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
