const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/documentController');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// All routes require authentication
router.use(authenticate);

// Get admin list (for client to select when sending documents)
router.get('/admins', authorize('Client'), adminController.getAdminList);

// Upload document
router.post('/upload', authorize('Client', 'Admin'), upload.single('file'), documentController.uploadDocument);

// Get processed documents
router.get('/processed', authorize('Client', 'Admin'), documentController.getProcessedDocuments);

// Download processed document
router.get('/processed/:id/file', authorize('Client', 'Admin', 'Company'), documentController.downloadProcessedDocument);

// Client ready documents
router.get('/client/documents/ready', documentController.getClientReadyDocuments);
router.get('/client/documents/:id', authorize('Client'), documentController.getClientDocumentDetail);
router.get('/client/documents/:id/file', authorize('Client'), documentController.downloadClientDocumentFile);
router.get('/client/documents/:id/data', authorize('Client'), documentController.downloadClientDocumentData);

// Batch operations
router.post('/processed/download-batch', authorize('Client', 'Admin', 'Company'), documentController.downloadBatch);
router.post('/processed/send-email', authorize('Client', 'Admin'), documentController.sendByEmail);
router.post('/processed/delete-batch', authorize('Client', 'Admin'), documentController.deleteBatch);

module.exports = router;

