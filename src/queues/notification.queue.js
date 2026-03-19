const { Queue } = require("bullmq");
const { REDIS_URL } = require("../config/env");

// Create the Queue
const notificationQueue = new Queue("notifications", {
  connection: { url: REDIS_URL }
});

module.exports = notificationQueue;