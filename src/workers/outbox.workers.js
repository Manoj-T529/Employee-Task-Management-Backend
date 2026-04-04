// workers/outbox.worker.js
const cron = require("node-cron");
const prisma = require("../config/prisma");
const notificationQueue = require("../queues/notification.queue");
const logger = require("../utils/logger");

const startOutboxWorker = () => {
  cron.schedule("*/10 * * * * *", async () => {
    try {
      
      const events = await prisma.$queryRaw`
        SELECT * FROM outbox_events 
        WHERE status = 'PENDING' 
        ORDER BY created_at ASC 
        LIMIT 50 
        FOR UPDATE SKIP LOCKED
      `;

      if (events.length === 0) return;

      logger.info(`Processing ${events.length} outbox events`);

      for (const event of events) {
        try {
          if (event.topic === "TASK_ASSIGNED" || event.topic === "TASK_ASSIGNED_UPDATED") {
            await notificationQueue.add("taskNotification", event.payload);
          }

          // Mark as PROCESSED
          await prisma.outbox_events.update({
            where: { id: event.id },
            data: { status: "PROCESSED" }
          });
          
        } catch (err) {
          logger.error("Failed to process single outbox event", { eventId: event.id, error: err.message });
          await prisma.outbox_events.update({
            where: { id: event.id },
            data: { status: "FAILED" }
          });
        }
      }
    } catch (error) {
      logger.error("Outbox worker crashed during polling", { error: error.message });
    }
  });
};

module.exports = startOutboxWorker;


// const cron = require("node-cron");
// const prisma = require("../config/prisma");
// const notificationQueue = require("../queues/notification.queue");
// const logger = require("../utils/logger");


// const startOutboxWorker = () => {
//   cron.schedule("*/10 * * * * *", async () => {
//     try {
      
//       const events = await prisma.outbox_events.findMany({
//         where: { status: "PENDING" },
//         take: 50,
//         orderBy: { created_at: "asc" }
//       });

//       if (events.length === 0) return;

//       logger.info(`Processing ${events.length} outbox events`);

  
//       for (const event of events) {
//         try {
          
//           if (event.topic === "TASK_ASSIGNED" || event.topic === "TASK_ASSIGNED_UPDATED") {
//             await notificationQueue.add("taskNotification", event.payload);
//           }
          

//           await prisma.outbox_events.update({
//             where: { id: event.id },
//             data: { status: "PROCESSED" }
//           });
          
//         } catch (err) {
//           logger.error("Failed to process single outbox event", { eventId: event.id, error: err.message });
//           await prisma.outbox_events.update({
//             where: { id: event.id },
//             data: { status: "FAILED" }
//           });
//         }
//       }
//     } catch (error) {
//       logger.error("Outbox worker crashed during polling", { error: error.message });
//     }
//   });
  
//   logger.info("Outbox Background Worker started successfully");
// };

// module.exports = startOutboxWorker;