const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { auth, role } = require('../middlewares/auth');


router.get('/', ctrl.getProducts);
router.get('/:id', ctrl.getProductById);


router.post('/', auth, role('admin'), ctrl.createProduct);
router.put('/:id', auth, role('admin'), ctrl.updateProduct);
router.patch('/:id/toggle', auth, role('admin'), ctrl.toggleProduct);

module.exports = router;