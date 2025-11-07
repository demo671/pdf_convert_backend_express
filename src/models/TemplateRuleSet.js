const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TemplateRuleSet = sequelize.define('TemplateRuleSet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  jsonDefinition: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'json_definition'
  },
  createdByUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by_user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'template_rule_sets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = TemplateRuleSet;

