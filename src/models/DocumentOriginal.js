const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DocumentOriginal = sequelize.define('DocumentOriginal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uploaderUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'uploader_user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: true, // Original file no longer saved to storage
    field: 'file_path'
  },
  originalFileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'original_file_name'
  },
  fileSizeBytes: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
    field: 'file_size_bytes'
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'uploaded_at'
  },
  uploadBatchId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'upload_batch_id'
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1=Uploaded, 2=Processing, 3=ReadyForPreview, 4=Approved, 5=Rejected'
  }
}, {
  tableName: 'document_originals',
  timestamps: false
});

// Status enum
DocumentOriginal.STATUS = {
  UPLOADED: 1,
  PROCESSING: 2,
  READY_FOR_PREVIEW: 3,
  APPROVED: 4,
  REJECTED: 5
};

module.exports = DocumentOriginal;

