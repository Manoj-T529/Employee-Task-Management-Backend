const { Worker } = require("bullmq");
const { REDIS_URL } = require("../config/env");
const logger = require("../config/logger");

const worker = new Worker("notifications", async (job) => {
  const { eventType, data } = job.data;

  if (eventType === "TASK_ASSIGNED") {
    logger.info(`[KAFKA/BULLMQ] Processing TASK_ASSIGNED for Task ${data.taskId}`);
    logger.info(`[KAFKA/BULLMQ] Sending Push/Email to Users: ${data.users.join(", ")}`);
    
    // Simulate API delay for email sending
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

}, { connection: { url: REDIS_URL } });

worker.on("completed", (job) => logger.info(`Job ${job.id} completed successfully`));
worker.on("failed", (job, err) => logger.error(`Job ${job.id} failed: ${err.message}`));

// const eventBus = require("../events/eventBus");
// const logger = require("../config/logger");

// eventBus.on("taskAssigned", (data) => {
//   logger.info(`Sending notification for Task ${data.taskId} to users: ${data.users.join(", ")}`);
//   // Add Email/Websocket/Push logic here
// });