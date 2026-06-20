const express = require("express");
const router = express.Router();
const bannerCtrl = require("../controllers/bannerController");

router.get("/", bannerCtrl.list);

module.exports = router;