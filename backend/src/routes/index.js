const express = require("express");
const router = express.Router();
const authRoutes = require("./auth");
const bannerRoutes = require("./banner");
const productRoutes = require("./product");
const accountRoutes = require("./account");

const auth = require("../middlewares/auth").auth;
const role = require("../middlewares/auth").role;

const bannerController = require("../controllers/bannerController");

router.get("/", (req, res) =>
  res.json({ message: "Cho Nong San API dang chay", version: "2.0.0" }),
);

router.use("/auth", authRoutes);
router.use("/banners", bannerRoutes);
router.use("/", productRoutes);
router.use("/", accountRoutes);

router.get("/admin/banners", auth, role("admin"), bannerController.listAll);
router.post("/admin/banners", auth, role("admin"), bannerController.create);
router.put("/admin/banners/:id", auth, role("admin"), bannerController.update);
router.patch("/admin/banners/:id/toggle", auth, role("admin"), bannerController.toggle);
router.delete("/admin/banners/:id", auth, role("admin"), bannerController.remove);

module.exports = router;
