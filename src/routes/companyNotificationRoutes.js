const express = require('express');
const router = express.Router();
const companyNotificationController = require('../controllers/companyNotificationController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Company notifications
router.get('/', authorize('Company'), companyNotificationController.getNotifications);
router.put('/:id/read', authorize('Company'), companyNotificationController.markAsRead);
router.delete('/:id', authorize('Company'), companyNotificationController.deleteNotification);
router.delete('/', authorize('Company'), companyNotificationController.clearAll);

module.exports = router;

