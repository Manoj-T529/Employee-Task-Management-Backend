const router = require("express").Router();
const taskController = require("../controllers/task.controller");
const role = require("../middleware/role.middleware");
const { idempotency } = require("../middleware/idempotency.middleware");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { createTaskSchema, logTimeSchema } = require("../validators/schema");
// Apply Auth globally to all task routes
router.use(protect);


router.patch("/:taskId/status", idempotency, taskController.updateStatus);

// --- READ-ONLY ROUTES (No Idempotency needed) ---
router.get("/project/:projectId/board", taskController.getBoard);
router.get("/:taskId/comments", taskController.getComments);

router.get("/calendar", role("ADMIN", "EMPLOYEE"), taskController.calendar);

router.patch("/:taskId/details", role("ADMIN", "EMPLOYEE"), taskController.updateTaskDetails);
router.post("/:taskId/comments", role("ADMIN", "EMPLOYEE"), taskController.addComment);


// e.g. task.routes.js
router.post("/:taskId/time-logs", validate(logTimeSchema), taskController.logTaskTime);
router.get("/:taskId/time-logs",  taskController.getTaskTimeLogs);

// Admin Only
router.use(role("ADMIN"));
router.post("/", idempotency,validate(createTaskSchema),taskController.createTask);
router.post("/:taskId/assign", idempotency, taskController.assignUsers);
router.patch("/:taskId/assign",idempotency, taskController.assignUsers);
router.patch("/:taskId/schedule", idempotency,taskController.rescheduleTask);
router.get("/:taskId", taskController.getTask);
router.delete("/:taskId", idempotency, taskController.deleteTask);


module.exports = router;

