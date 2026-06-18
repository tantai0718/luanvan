const express = require("express");
const productController = require("../controllers/productController");
const { auth, role } = require("../middlewares/auth");

const router = express.Router();

router.get("/categories", productController.categories);
router.get("/products", productController.list);
router.get("/products/:id", productController.detail);
router.get("/products/:id/reviews", productController.reviews);

router.get("/admin/products", auth, role("admin"), productController.adminList);
router.post("/products", auth, role("admin"), productController.create);
router.put("/products/:id", auth, role("admin"), productController.update);
router.patch("/products/:id/toggle", auth, role("admin"), productController.toggle);
router.delete("/products/:id", auth, role("admin"), productController.remove);

module.exports = router;
