const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reviewController');
const { auth, role } = require('../middlewares/auth');

router.get('/product/:id', ctrl.getProductReviews);


router.post('/', auth, ctrl.createReview);


router.get('/admin', auth, role('admin'), ctrl.adminGetReviews);
router.patch('/admin/:id/reply', auth, role('admin'), ctrl.adminReplyReview);
router.delete('/admin/:id/reply', auth, role('admin'), ctrl.adminDeleteReply);

module.exports = router;