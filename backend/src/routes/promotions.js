const express = require("express");
const router = express.Router();
const promotionCtrl = require("../controllers/promotionController");
const auth = require("../middlewares/auth").auth;
const role = require("../middlewares/auth").role;

router.get("/promotions", promotionCtrl.getActivePromotions);

router.get("/admin/promotions", auth, role("admin"), promotionCtrl.adminGetAll);
router.post("/admin/promotions", auth, role("admin"), promotionCtrl.adminCreate);
router.put("/admin/promotions/:id", auth, role("admin"), promotionCtrl.adminUpdate);
router.patch("/admin/promotions/:id/status", auth, role("admin"), promotionCtrl.adminToggleStatus);
router.delete("/admin/promotions/:id", auth, role("admin"), promotionCtrl.adminDelete);

module.exports = router;
