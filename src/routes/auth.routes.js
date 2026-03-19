const router = require("express").Router();
const authController = require("../controllers/auth.controller");

router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;

// const router = require("express").Router();
// const authMiddleware = require("../middleware/auth.middleware");
// const authController = require("../controllers/auth.controller");
// const taskController = require("../controllers/task.controller");

// router.post("/register", authController.register);
// router.post("/login", authController.login);
// router.post("/", authMiddleware, taskController.createTask);

// module.exports = router;