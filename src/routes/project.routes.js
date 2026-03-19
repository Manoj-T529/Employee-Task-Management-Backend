const router = require("express").Router();
const projectController = require("../controllers/project.controller");
const role = require("../middleware/role.middleware");

// ONLY ADMIN
router.use(role("ADMIN"));
router.post("/", projectController.createProject);
router.get("/", projectController.getAllProjects);
router.put("/:id", projectController.updateProject);
router.delete("/:id", projectController.deleteProject);

module.exports = router;


// const router = require("express").Router();
// const projectController = require("../controllers/project.controller");
// const auth = require("../middleware/auth.middleware");

// router.post("/", auth, projectController.createProject);
// router.get("/:projectId",auth,projectController.getBoard);

// module.exports = router;