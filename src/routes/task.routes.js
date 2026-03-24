const router = require("express").Router();
const taskController = require("../controllers/task.controller");
const role = require("../middleware/role.middleware");

// Employee & Admin
router.patch("/:taskId/status", role("ADMIN", "EMPLOYEE"), taskController.updateStatus);
router.get("/project/:projectId/board", role("ADMIN", "EMPLOYEE"), taskController.getBoard);
router.get("/calendar", role("ADMIN", "EMPLOYEE"), taskController.calendar);

router.patch("/:taskId/details", role("ADMIN", "EMPLOYEE"), taskController.updateTaskDetails);
router.post("/:taskId/comments", role("ADMIN", "EMPLOYEE"), taskController.addComment);
router.get("/:taskId/comments", role("ADMIN", "EMPLOYEE"), taskController.getComments);

// Admin Only
router.use(role("ADMIN"));
router.post("/", taskController.createTask);
router.post("/:taskId/assign", taskController.assignUsers);
router.patch("/:taskId/schedule", taskController.rescheduleTask);
router.delete("/:taskId", taskController.deleteTask);


module.exports = router;


// const router = require("express").Router()
// const taskController = require("../controllers/task.controller")
// const auth = require("../middleware/auth.middleware")
// const role = require("../middleware/role.middleware")

// router.post("/",auth,role(["ADMIN"]),taskController.createTask)

// router.post("/:taskId/assign",auth,role(["ADMIN"]),taskController.assignUsers)

// router.patch("/:taskId/status",auth,taskController.updateStatus)

// router.get("/project/:projectId/board",auth,taskController.getBoard)

// router.get("/calendar",auth,taskController.calendar)

// module.exports = router