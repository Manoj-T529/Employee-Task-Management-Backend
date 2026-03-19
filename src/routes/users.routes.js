const router = require("express").Router();
const controller = require("../controllers/users.controller");
const role = require("../middleware/role.middleware");

router.get("/", controller.getAll);
router.get("/employees", controller.getEmployees);

// ONLY ADMIN
router.use(role("ADMIN"));
router.post("/", controller.create);
router.put("/:id", controller.updateUser);
router.delete("/:id", controller.deleteUser);

module.exports = router;

// const router = require("express").Router();

// const controller = require("../controllers/users.controller");

// const auth = require("../middleware/auth.middleware");



// router.post(
//   "/",
//   auth,
//   controller.create
// );

// router.get(
//   "/",
//   auth,
//   controller.getAll
// );

// router.get(
//   "/employees",
//   auth,
//   controller.getEmployees
// );


// module.exports = router;