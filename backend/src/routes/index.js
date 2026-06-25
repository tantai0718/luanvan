const express = require("express");
const router = express.Router();
const authRoutes = require("./auth");
const bannerRoutes = require("./banner");
const accountRoutes = require("./account");

const auth = require("../middlewares/auth").auth;
const role = require("../middlewares/auth").role;

const bannerController = require("../controllers/bannerController");

router.get("/", (req, res) =>
  res.json({ message: "Cho Nong San API dang chay", version: "2.0.0" }),
);

router.use("/auth", authRoutes);
router.use("/admin", bannerRoutes);;
router.use("/", accountRoutes);


module.exports = router;
