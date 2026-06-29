const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const { auth, role } = require('../middlewares/auth');

router.post('/', auth, ctrl.createOrder);
router.get('/', auth, ctrl.getMyOrders);
router.get('/:id', auth, ctrl.getOrderById);
router.patch('/:id/cancel', auth, ctrl.cancelOrder);

router.get('/admin/list', auth, role('admin'), ctrl.adminGetOrders);
router.patch('/admin/:id/status', auth, role('admin'), ctrl.adminUpdateStatus);

module.exports = router;