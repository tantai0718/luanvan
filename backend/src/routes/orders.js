const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/orderController");
const { auth, role } = require("../middlewares/auth");

// Admin (static before dynamic)
router.get("/admin/list", auth, role("admin"), ctrl.adminGetOrders);
router.get("/admin/preorder-summary", auth, role("admin"), ctrl.adminGetPreorderSummary);
router.get("/admin/preorder-summary/detail", auth, role("admin"), ctrl.adminGetPreorderSummaryDetail);
router.get("/admin/:id", auth, role("admin"), ctrl.adminGetOrderById);
router.patch("/admin/:id/status", auth, role("admin"), ctrl.adminUpdateStatus);
router.patch("/admin/:id/confirm-banking", auth, role("admin"), ctrl.adminConfirmBanking);

// User
router.post("/", auth, ctrl.createOrder);
router.post("/preorder", auth, ctrl.createPreorder);
router.get("/", auth, ctrl.getMyOrders);
router.get("/:id", auth, ctrl.getOrderById);
router.patch("/:id/cancel", auth, ctrl.cancelOrder);


module.exports = router;