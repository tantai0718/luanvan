const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/baiVietController');
const { auth, role } = require('../middlewares/auth');

// Admin (static before dynamic)
router.get('/admin/all', auth, role('admin'), ctrl.adminList);
router.post('/admin', auth, role('admin'), ctrl.create);
router.post('/admin/upload', auth, role('admin'), ctrl.uploadImage);
router.put('/admin/:id', auth, role('admin'), ctrl.update);
router.delete('/admin/:id', auth, role('admin'), ctrl.remove);

// Public
router.get('/', ctrl.listPublic);
router.get('/:id', ctrl.getById);

module.exports = router;
