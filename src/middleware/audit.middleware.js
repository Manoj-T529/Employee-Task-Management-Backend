const prisma = require("../config/prisma");
const { v4: uuid } = require("uuid");
const logger = require("../config/logger");

module.exports = (req, res, next) => {
  res.on("finish", async () => {
    if (req.user?.id && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      try {
        await prisma.audit_logs.create({
          data: {
            id: uuid(),
            entity_type: "API",
            entity_id: req.originalUrl,
            action: req.method,
            performed_by: req.user.id,
            new_value: { statusCode: res.statusCode }, // Must be object for Json? type
          },
        });
      } catch (err) {
        logger.error(`Audit Log Failed: ${err.message}`);
      }
    }
  });
  next();
};


// const prisma = require("../config/prisma");
// const { v4: uuid } = require("uuid");
// const eventBus = require("../events/eventBus")

// module.exports = async (req, res, next) => {

//   const originalSend = res.send;

//  res.send = async function (body) {
//   try {
    
//     console.log("User Id at Audit Log "+req.user.id);

//     if (req.user?.id) {
//       await prisma.audit_logs.create({
//         data: {
//           id: uuid(),
//           entity_type: "API",
//           entity_id: req.originalUrl,
//           action: req.method,
//           performed_by: req.user.id
//         }
//       });
//     }
//   } catch (err) {
//     console.error("Audit log failed", err.message);
//   }

//   return originalSend.call(this, body);
// };
//   next();
// };


