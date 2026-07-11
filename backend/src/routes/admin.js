const express = require("express");
const router = express.Router();
const { auth, role } = require("../middlewares/auth");
const productCtrl = require("../controllers/productController");
const categoryCtrl = require("../controllers/categoryController");
const orderCtrl = require('../controllers/orderController');
const seasonCtrl = require("../controllers/seasonController");

// ── Sản phẩm ─────────────────────────────────────────────────────────────
router.get("/products", auth, role("admin"), productCtrl.getProducts);
router.delete("/products/:id", auth, role("admin"), productCtrl.deleteProduct);
router.post("/products/upload", auth, role("admin"), productCtrl.uploadImage);

// ── Danh mục ─────────────────────────────────────────────────────────────
router.get("/categories", auth, role("admin"), categoryCtrl.list);
router.get(
  "/categories/:id/products",
  auth,
  role("admin"),
  categoryCtrl.listProducts,
);
router.post("/categories", auth, role("admin"), categoryCtrl.create);
router.put("/categories/:id", auth, role("admin"), categoryCtrl.update);
router.patch("/categories/:id/toggle",auth,role("admin"),categoryCtrl.toggle,);
router.delete("/categories/:id", auth, role("admin"), categoryCtrl.remove);
router.get('/orders', auth, role('admin'), orderCtrl.adminGetOrders);

//seasons
router.get("/seasons", auth, role("admin"), seasonCtrl.list);
router.get("/seasons/:id/products", auth, role("admin"), seasonCtrl.listProducts);
router.post("/seasons", auth, role("admin"), seasonCtrl.create);
router.put("/seasons/:id", auth, role("admin"), seasonCtrl.update);
router.patch("/seasons/:id/toggle", auth, role("admin"), seasonCtrl.toggle);
router.delete("/seasons/:id", auth, role("admin"), seasonCtrl.remove);
router.post("/seasons/:id/products", auth, role("admin"), seasonCtrl.addProduct);
router.delete("/seasons/:id/products/:masp", auth, role("admin"), seasonCtrl.removeProduct);


module.exports = router;
