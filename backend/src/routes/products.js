const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { auth, role } = require('../middlewares/auth');

// Public — không cần đăng nhập
router.get('/', ctrl.getProducts);
router.get('/:id', ctrl.getProductById);
router.get('/:id/reviews', ctrl.getProductReviews);

// Cần đăng nhập + là admin
router.post('/', auth, role('admin'), ctrl.createProduct);
router.put('/:id', auth, role('admin'), ctrl.updateProduct);
router.patch('/:id/toggle', auth, role('admin'), ctrl.toggleProduct);

// reviewRouter export riêng vì mount ở path /reviews (không phải /products)
const reviewRouter = express.Router();
reviewRouter.post('/', auth, ctrl.createReview);

module.exports = { productRouter: router, reviewRouter };