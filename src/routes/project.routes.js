const router = require("express").Router();
const projectController = require("../controllers/project.controller");
const role = require("../middleware/role.middleware");

router.get("/", role("ADMIN", "EMPLOYEE"), projectController.getAllProjects);

// ONLY ADMIN
router.use(role("ADMIN"));
router.post("/", projectController.createProject);
router.put("/:id", projectController.updateProject);
router.delete("/:id", projectController.deleteProject);


module.exports = router;


// const router = require("express").Router();
// const projectController = require("../controllers/project.controller");
// const auth = require("../middleware/auth.middleware");

// router.post("/", auth, projectController.createProject);
// router.get("/:projectId",auth,projectController.getBoard);

// module.exports = router;