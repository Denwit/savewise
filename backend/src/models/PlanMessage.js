import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const PlanMessage = sequelize.define('PlanMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 2000]
    }
  },
  message_type: {
    type: DataTypes.ENUM('text', 'system'),
    defaultValue: 'text'
  },
  delivered_to: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  read_by: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  edited_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'plan_messages',
  timestamps: true,
  underscored: true,
  defaultScope: {
    where: { deleted_at: null }
  },
  indexes: [
    { fields: ['plan_id', 'created_at'] },
    { fields: ['user_id'] }
  ]
});

export default PlanMessage;
