const router = require("express").Router();
const authRoutes = require("./auth.routes");
const userRoutes = require("./users.routes");
const projectRoutes = require("./project.routes");
const taskRoutes = require("./task.routes");
const auth = require("../middleware/auth.middleware");
const audit = require("../middleware/audit.middleware");

router.use("/auth", authRoutes);

// Apply auth & audit globally to authenticated routes
router.use(auth);
router.use(audit);

router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);

module.exports = router;