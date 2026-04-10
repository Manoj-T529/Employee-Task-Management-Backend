const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const  {protect: auth} = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { registerSchema, authSchema } = require("../validators/schema");

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(authSchema), authController.login);
router.post("/logout", auth, authController.logout);

module.exports = router;

// const router = require("express").Router();
// const authMiddleware = require("../middleware/auth.middleware");
// const authController = require("../controllers/auth.controller");
// const taskController = require("../controllers/task.controller");

// router.post("/register", authController.register);
// router.post("/login", authController.login);
// router.post("/", authMiddleware, taskController.createTask);

// module.exports = router;