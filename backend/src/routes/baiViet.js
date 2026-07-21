const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/baiVietController');
const { auth } = require('../middlewares/auth');
const role = require('../middlewares/role');

// Public
router.get('/', ctrl.listPublic);
router.get('/:id', ctrl.getById);

// Admin
router.get('/admin/all', auth, role('admin'), ctrl.adminList);
router.post('/admin', auth, role('admin'), ctrl.create);
router.post('/admin/import-url', auth, role('admin'), ctrl.importUrl);
router.put('/admin/:id', auth, role('admin'), ctrl.update);
router.delete('/admin/:id', auth, role('admin'), ctrl.remove);

module.exports = router;
