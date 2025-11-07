const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all notifications
router.get('/', notificationController.getNotifications);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Clear all notifications
router.delete('/', notificationController.clearAll);

// Delete single notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;

