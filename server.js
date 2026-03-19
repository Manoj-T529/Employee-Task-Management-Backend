const app = require("./src/app");
const http = require("http");
const { PORT } = require("./src/config/env");
const logger = require("./src/config/logger");
const prisma = require("./src/config/prisma");
const { initSocket } = require("./src/config/socket"); 

require("./src/workers/notification.worker");

const server = http.createServer(app);

// INIT SOCKET.IO
initSocket(server).then(() => {
  logger.info("✅ WebSockets initialized with Redis Adapter");
});

server.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful Shutdown
const shutdown = async () => {
  logger.info("Gracefully shutting down...");
  await prisma.$disconnect();
  server.close(() => {
    logger.info("Closed out remaining connections.");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Handle Uncaught Exceptions
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  server.close(() => process.exit(1));
});

// require("dotenv").config();
// require("./src/workers/notification.worker");
// const app = require("./src/app");

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });