const express = require("express");
const accountController = require("../controllers/accountController");
const { auth, role } = require("../middlewares/auth");

const router = express.Router();

router.get("/admin/accounts", auth, role("admin"), accountController.list);
router.patch("/admin/accounts/:id/toggle", auth, role("admin"), accountController.toggle);

module.exports = router;
