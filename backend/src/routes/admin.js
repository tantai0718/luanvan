const express = require('express');
const router = express.Router();
const { auth, role } = require('../middlewares/auth');
const productCtrl = require('../controllers/productController');
const categoryCtrl = require('../controllers/categoryController');

// ── Sản phẩm ─────────────────────────────────────────────────────────────
router.get('/products', auth, role('admin'), productCtrl.getProducts);
router.delete('/products/:id', auth, role('admin'), productCtrl.deleteProduct);
router.post('/products/upload', auth, role('admin'), productCtrl.uploadImage);

// ── Danh mục ─────────────────────────────────────────────────────────────
router.get('/categories', auth, role('admin'), categoryCtrl.list);
router.get('/categories/:id/products', auth, role('admin'), categoryCtrl.listProducts);
router.post('/categories', auth, role('admin'), categoryCtrl.create);
router.put('/categories/:id', auth, role('admin'), categoryCtrl.update);
router.patch('/categories/:id/toggle', auth, role('admin'), categoryCtrl.toggle);
router.delete('/categories/:id', auth, role('admin'), categoryCtrl.remove);

module.exports = router;