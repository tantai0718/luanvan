const express = require("express");
const router = express.Router();
const bannerCtrl = require("../controllers/bannerController");
const { auth, role } = require("../middlewares/auth");

router.get("/", bannerCtrl.list);
router.post("/", auth, role("admin"), bannerCtrl.create);
router.put("/:id", auth, role("admin"), bannerCtrl.update);
router.patch("/:id/toggle", auth, role("admin"), bannerCtrl.toggle);
router.delete("/:id", auth, role("admin"), bannerCtrl.remove);

module.exports = router;
