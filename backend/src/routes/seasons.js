const express = require("express");
const router = express.Router();
const { auth, role } = require("../middlewares/auth");
const seasonCtrl = require("../controllers/seasonController");

router.get("/", auth, role("admin"), seasonCtrl.list);
router.get("/:id/products", auth, role("admin"), seasonCtrl.listProducts);
router.post("/", auth, role("admin"), seasonCtrl.create);
router.put("/:id", auth, role("admin"), seasonCtrl.update);
router.patch("/:id/toggle", auth, role("admin"), seasonCtrl.toggle);
router.delete("/:id", auth, role("admin"), seasonCtrl.remove);
router.post("/:id/products", auth, role("admin"), seasonCtrl.addProduct);
router.delete("/:id/products/:masp", auth, role("admin"), seasonCtrl.removeProduct);

module.exports = router;