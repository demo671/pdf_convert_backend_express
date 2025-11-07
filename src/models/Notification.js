const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'client_user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  adminUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'admin_user_id',
    comment: 'Which admin this notification is for',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  documentCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'document_count'
  },
  sentAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'sent_at'
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
  tableName: 'notifications',
  timestamps: false
});

module.exports = Notification;

