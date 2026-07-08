const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/orderController");
const { auth, role } = require("../middlewares/auth");

router.post("/", auth, ctrl.createOrder);
router.post("/preorder", auth, ctrl.createPreorder);
router.get("/", auth, ctrl.getMyOrders);
router.get("/:id", auth, ctrl.getOrderById);
router.patch("/:id/cancel", auth, ctrl.cancelOrder);
router.get("/:id", auth, ctrl.getOrderById);

router.get("/admin/list", auth, role("admin"), ctrl.adminGetOrders);
router.patch("/admin/:id/status", auth, role("admin"), ctrl.adminUpdateStatus);
router.patch("/admin/:id/confirm-banking", auth, role("admin"), ctrl.adminConfirmBanking);
router.get("/admin/:id",auth,role("admin"),ctrl.adminGetOrderById);

module.exports = router;
