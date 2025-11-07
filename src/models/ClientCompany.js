const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClientCompany = sequelize.define('ClientCompany', {
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
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'company_id',
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'client_companies',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['client_user_id', 'company_id'],
      name: 'unique_client_company'
    }
  ]
});

module.exports = ClientCompany;

