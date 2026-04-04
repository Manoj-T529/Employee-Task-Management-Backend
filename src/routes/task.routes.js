const router = require("express").Router();
const taskController = require("../controllers/task.controller");
const role = require("../middleware/role.middleware");
const { idempotency } = require("../middleware/idempotency.middleware");
const { protect } = require("../middleware/auth.middleware");

// Apply Auth globally to all task routes
router.use(protect);

// --- STATE CHANGING ROUTES (Require Idempotency) ---
// Clients must pass header: `x-idempotency-key: <uuid>` to these routes
//router.post("/", idempotency, taskController.createTask);
router.patch("/:taskId/status", idempotency, taskController.updateStatus);
//router.post("/:taskId/assign", idempotency, taskController.assignUsers);
//router.delete("/:taskId", idempotency, taskController.deleteTask);

// --- READ-ONLY ROUTES (No Idempotency needed) ---
router.get("/project/:projectId/board", taskController.getBoard);
router.get("/:taskId/comments", taskController.getComments);

// Employee & Admin
//router.patch("/:taskId/status", role("ADMIN", "EMPLOYEE"), taskController.updateStatus);
//router.get("/project/:projectId/board", role("ADMIN", "EMPLOYEE"), taskController.getBoard);
router.get("/calendar", role("ADMIN", "EMPLOYEE"), taskController.calendar);

router.patch("/:taskId/details", role("ADMIN", "EMPLOYEE"), taskController.updateTaskDetails);
router.post("/:taskId/comments", role("ADMIN", "EMPLOYEE"), taskController.addComment);
//router.get("/:taskId/comments", role("ADMIN", "EMPLOYEE"), taskController.getComments);

// e.g. task.routes.js
router.post("/:taskId/time-logs", taskController.logTaskTime);
router.get("/:taskId/time-logs",  taskController.getTaskTimeLogs);

// Admin Only
router.use(role("ADMIN"));
router.post("/", idempotency,taskController.createTask);
router.post("/:taskId/assign", idempotency, taskController.assignUsers);
router.patch("/:taskId/assign",idempotency, taskController.assignUsers);
router.patch("/:taskId/schedule", idempotency,taskController.rescheduleTask);
router.get("/:taskId", taskController.getTask);
router.delete("/:taskId", idempotency, taskController.deleteTask);


module.exports = router;

