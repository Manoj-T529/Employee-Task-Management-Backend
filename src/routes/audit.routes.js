const express = require("express");
const router = express.Router();
const auditController = require("../controllers/audit.controller");

// Assuming you have an authentication middleware (like protect)
const {protect: auth} = require("../middleware/auth.middleware"); 

router.get(
  "/", 
  auth, 
  auditController.getGlobalActivity
);

module.exports = router;