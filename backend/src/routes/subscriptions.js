const express = require("express");
const router = express.Router();

const subscriptionCtrl = require("../controllers/subscriptionController");
const auth = require("../middlewares/auth").auth;
const role = require("../middlewares/auth").role;

router.post("/subscriptions", auth, subscriptionCtrl.create);
router.get("/subscriptions", auth, subscriptionCtrl.getAll);
router.patch("/subscriptions/:id/cancel", auth, subscriptionCtrl.cancel);

router.get("/admin/subscriptions", auth, role("admin"), subscriptionCtrl.adminGetAll);
router.get("/admin/subscriptions/summary", auth, role("admin"), subscriptionCtrl.adminGetSummary);
router.get("/admin/subscriptions/summary/detail", auth, role("admin"), subscriptionCtrl.adminGetSummaryDetail);
router.patch("/admin/subscriptions/:id/deliver", auth, role("admin"), subscriptionCtrl.adminDeliver);

module.exports = router;