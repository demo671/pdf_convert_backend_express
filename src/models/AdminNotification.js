const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdminNotification = sequelize.define('AdminNotification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  notificationType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'notification_type',
    comment: 'NEW_USER, NEW_COMPANY, DOCUMENT_SENT'
  },
  relatedUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'related_user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  relatedCompanyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'related_company_id',
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'admin_notifications',
  timestamps: false
});

// Notification type enum
AdminNotification.TYPES = {
  NEW_USER: 'NEW_USER',
  NEW_COMPANY: 'NEW_COMPANY',
  DOCUMENT_SENT: 'DOCUMENT_SENT'
};

module.exports = AdminNotification;

