const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const bannerRoutes = require("./banner");
const accountRoutes = require("./account");

const { productRouter, reviewRouter } = require("./products");
const cartRouter = require("./cart");
const orderRouter = require("./orders");
const subscriptionRoutes = require("./subscriptions");

const productCtrl = require("../controllers/productController");
const adminRoutes = require("./admin");

router.get("/", (req, res) =>
  res.json({ message: "Cho Nong San API dang chay", version: "2.0.0" }),
);

router.use("/auth", authRoutes);
router.use("/admin", bannerRoutes);
router.use("/admin", adminRoutes);
router.use("/", accountRoutes);

router.get("/categories", productCtrl.getCategories);
router.use("/products", productRouter);
router.use("/reviews", reviewRouter);
router.use("/cart", cartRouter);
router.use("/orders", orderRouter);
router.use("/", subscriptionRoutes);

module.exports = router;