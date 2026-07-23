const express = require("express");
const router = express.Router();
const { auth, role } = require("../middlewares/auth");
const notificationCtrl = require("../controllers/notificationController");

// ── Admin (static before dynamic) ──────────────────
router.get("/admin/notifications/global", auth, role("admin"), notificationCtrl.adminGetAllGlobal);
router.post("/admin/notifications/global", auth, role("admin"), notificationCtrl.adminCreate);
router.put("/admin/notifications/global/:id", auth, role("admin"), notificationCtrl.adminUpdate);
router.patch("/admin/notifications/global/:id/toggle", auth, role("admin"), notificationCtrl.adminToggle);
router.delete("/admin/notifications/global/:id", auth, role("admin"), notificationCtrl.adminDelete);
router.get("/admin/notifications/orders", auth, role("admin"), notificationCtrl.adminGetOrderHistory);

// ── User (static before dynamic) ───────────────────
router.get("/notifications", auth, notificationCtrl.getMyNotifications);
router.patch("/notifications/read-all", auth, notificationCtrl.markAllAsRead);
router.patch("/notifications/:id/read", auth, notificationCtrl.markAsRead);

// ── Public ─────────────────────────────────────────
router.get("/notifications/global", notificationCtrl.getGlobalNotifications);

module.exports = router;
