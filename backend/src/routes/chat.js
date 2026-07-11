const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chatController');
const { auth, role } = require('../middlewares/auth');

router.get('/',auth,chatController.getMyMessages);

router.post('/',auth,chatController.sendMyMessage);


router.get('/admin',auth,role('admin'),chatController.getSessions);

router.get('/admin/:id',auth,role('admin'),chatController.getSessionMessages);

router.post('/admin/:id',auth,role('admin'),chatController.adminSendMessage);

router.patch('/admin/:id/close',auth,role('admin'),chatController.closeSession);

module.exports = router;