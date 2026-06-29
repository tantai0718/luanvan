const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cartController');
const { auth } = require('../middlewares/auth');

router.use(auth);

router.get('/', ctrl.getCart);
router.post('/', ctrl.addToCart);
router.put('/:masp', ctrl.updateCart);
router.delete('/:masp', ctrl.removeFromCart);
router.delete('/', ctrl.clearCart);

module.exports = router;