const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and Admin role
router.use(authenticate);
router.use(authorize('Admin'));

// Test endpoint to check database connection
router.get('/health', async (req, res) => {
  try {
    const { DocumentProcessed } = require('../models');
    const count = await DocumentProcessed.count();
    const sentToAdmin = await DocumentProcessed.count({ where: { isSentToAdmin: true } });
    res.json({ 
      status: 'OK', 
      totalDocuments: count,
      sentToAdmin: sentToAdmin,
      message: 'Database is accessible' 
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message, stack: error.stack });
  }
});

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// Users management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createAdmin);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);

// Documents
router.get('/documents', adminController.getDocuments);
router.delete('/documents', adminController.deleteDocuments);

// Analytics
router.get('/analytics', adminController.getAnalytics);

module.exports = router;

