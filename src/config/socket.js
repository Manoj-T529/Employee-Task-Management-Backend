const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const redis = require("redis");
const { REDIS_URL } = require("./env");
const logger = require("../utils/logger");

let io;

exports.initSocket = async (server) => {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PATCH"] }
  });

  // Create Pub/Sub clients for Redis Adapter
  const pubClient = redis.createClient({ url: REDIS_URL });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    logger.info(`🔌 Client connected: ${socket.id}`);

    // User joins a specific project "room" to only get updates for that board
    socket.on("joinProject", (projectId) => {
      socket.join(`project:${projectId}`);
      logger.info(`Socket ${socket.id} joined project:${projectId}`);
    });

    socket.on("disconnect", () => {
      logger.info(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Helper function to trigger real-time updates from your Controllers
exports.broadcastBoardUpdate = (projectId, action, data) => {
  if (io) {
    io.to(`project:${projectId}`).emit("boardUpdate", { action, data });
  }
};