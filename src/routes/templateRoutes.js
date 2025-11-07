const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all templates
router.get('/', templateController.getTemplates);

// Get single template
router.get('/:id', templateController.getTemplate);

// Create template (Admin only)
router.post('/', authorize('Admin'), templateController.createTemplate);

// Update template (Admin only)
router.put('/:id', authorize('Admin'), templateController.updateTemplate);

// Delete template (Admin only)
router.delete('/:id', authorize('Admin'), templateController.deleteTemplate);

module.exports = router;

