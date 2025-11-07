const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DocumentHistory = sequelize.define('DocumentHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  actionType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'action_type',
    comment: 'UPLOADED, PROCESSED, SENT_TO_ADMIN, DELETED_BY_ADMIN, UPLOAD_FAILED, PROCESSING_FAILED'
  },
  documentId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Nullable because document may be deleted
    field: 'document_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  userRole: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'user_role',
    comment: 'Client or Admin'
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'file_name'
  },
  fileSizeBytes: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'file_size_bytes'
  },
  batchId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'batch_id'
  },
  processingTimeMs: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'processing_time_ms',
    comment: 'Time taken to process document in milliseconds'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional data: RFC, folio, fecha, etc.'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'document_history',
  timestamps: false,
  indexes: [
    {
      name: 'idx_document_history_action_type',
      fields: ['action_type']
    },
    {
      name: 'idx_document_history_user_id',
      fields: ['user_id']
    },
    {
      name: 'idx_document_history_created_at',
      fields: ['created_at']
    },
    {
      name: 'idx_document_history_batch_id',
      fields: ['batch_id']
    }
  ]
});

// Action type enum
DocumentHistory.ACTION_TYPES = {
  UPLOADED: 'UPLOADED',
  PROCESSED: 'PROCESSED',
  SENT_TO_ADMIN: 'SENT_TO_ADMIN',
  DELETED_BY_ADMIN: 'DELETED_BY_ADMIN',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  PROCESSING_FAILED: 'PROCESSING_FAILED'
};

// Helper method to log an action
DocumentHistory.logAction = async function(data) {
  try {
    return await DocumentHistory.create({
      actionType: data.actionType,
      documentId: data.documentId || null,
      userId: data.userId,
      userRole: data.userRole || 'Client',
      fileName: data.fileName,
      fileSizeBytes: data.fileSizeBytes || null,
      batchId: data.batchId || null,
      processingTimeMs: data.processingTimeMs || null,
      errorMessage: data.errorMessage || null,
      metadata: data.metadata || {},
      createdAt: new Date()
    });
  } catch (error) {
    console.error('[DocumentHistory] Failed to log action:', error.message);
    // Don't throw - history logging should not break main flow
    return null;
  }
};

module.exports = DocumentHistory;

