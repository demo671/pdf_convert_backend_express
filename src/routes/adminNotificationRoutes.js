const express = require('express');
const router = express.Router();
const adminNotificationController = require('../controllers/adminNotificationController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Admin notifications
router.get('/', authorize('Admin'), adminNotificationController.getNotifications);
router.put('/:id/read', authorize('Admin'), adminNotificationController.markAsRead);
router.delete('/:id', authorize('Admin'), adminNotificationController.deleteNotification);
router.delete('/', authorize('Admin'), adminNotificationController.clearAll);

module.exports = router;

