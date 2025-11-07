const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CompanyNotification = sequelize.define('CompanyNotification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'company_id',
    references: {
      model: 'companies',
      key: 'id'
    }
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
  documentCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'document_count'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: false,
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
  tableName: 'company_notifications',
  timestamps: false
});

module.exports = CompanyNotification;

