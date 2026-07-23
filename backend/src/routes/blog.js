const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/blogController');
const { auth, role } = require('../middlewares/auth');

// Public
router.get('/', ctrl.list);
router.get('/categories', ctrl.categories);
router.get('/:id', ctrl.detail);

// Admin
router.post('/', auth, role('admin'), ctrl.create);
router.put('/:id', auth, role('admin'), ctrl.update);
router.delete('/:id', auth, role('admin'), ctrl.remove);

module.exports = router;
