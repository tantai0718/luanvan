const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const bannerRoutes = require("./banner");
const accountRoutes = require("./account");

// 3 file mới bạn vừa tạo
const { productRouter, reviewRouter } = require("./products");
const cartRouter = require("./cart");
const orderRouter = require("./orders");

const productCtrl = require("../controllers/productController");
const adminRoutes = require("./admin");

console.log("productCtrl.getCategories =", productCtrl.getCategories);
console.log("productCtrl =", Object.keys(productCtrl));
console.log("path =", require.resolve("../controllers/productController"));

router.get("/", (req, res) =>
  res.json({ message: "Cho Nong San API dang chay", version: "2.0.0" })
);

router.use("/auth", authRoutes);
router.use("/admin", bannerRoutes);
router.use("/admin", adminRoutes);
router.use("/", accountRoutes);

// Route mới thêm vào
router.get("/categories", productCtrl.getCategories);
router.use("/products", productRouter);
router.use("/reviews", reviewRouter);
router.use("/cart", cartRouter);
router.use("/orders", orderRouter);

module.exports = router;