const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const bannerRoutes = require("./banner");
const accountRoutes = require("./account");

const productRouter = require("./products");
const reviewRoutes = require("./reviews");
const cartRouter = require("./cart");
const orderRouter = require("./orders");
const subscriptionRoutes = require("./subscriptions");

const productCtrl = require("../controllers/productController");
const adminRoutes = require("./admin");
const chatRoutes = require('./chat');
const seasonRoutes = require("./seasons");
const dashboardRoutes = require("./dashboard");
const notificationRoutes = require("./notifications");
const baiVietRoutes = require("./baiViet");
const blogRoutes = require("./blog");

router.get("/", (req, res) =>
  res.json({ message: "Cho Nong San API dang chay", version: "2.0.0" }),
);

router.use("/auth", authRoutes);
router.use("/admin", bannerRoutes);
router.use("/admin", adminRoutes);
router.use("/", accountRoutes);

router.get("/categories", productCtrl.getCategories);
router.use("/products", productRouter);
router.use("/reviews", reviewRoutes);
router.use("/cart", cartRouter);
router.use("/orders", orderRouter);
router.use("/chat", chatRoutes);
router.use("/admin/seasons", seasonRoutes);
router.use("/", subscriptionRoutes);
router.use("/admin/dashboard", dashboardRoutes);
router.use("/", notificationRoutes);
router.use("/articles", baiVietRoutes);
router.use("/blog", blogRoutes);
module.exports = router;