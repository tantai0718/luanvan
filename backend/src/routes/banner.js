const express = require("express");
const router = express.Router();

const bannerCtrl = require("../controllers/bannerController");
const auth = require("../middlewares/auth").auth;
const role = require("../middlewares/auth").role;

router.get("/", bannerCtrl.list);

router.get("/banners", auth, role("admin"), bannerCtrl.listAll);
router.post("/banners", auth, role("admin"), bannerCtrl.create);
router.put("/banners/:id", auth, role("admin"), bannerCtrl.update);
router.patch("/banners/:id/toggle", auth, role("admin"), bannerCtrl.toggle);
router.delete("/banners/:id", auth, role("admin"), bannerCtrl.remove);

module.exports = router;