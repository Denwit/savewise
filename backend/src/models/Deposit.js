import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Deposit = sequelize.define('Deposit', {
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  // Original deposit amount before any repayment allocation
  original_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  deposit_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  expected_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('completed', 'pending', 'missed', 'late', 'rejected'),
    defaultValue: 'completed'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Stores which withdrawals were repaid and how much
  repayment_details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deletion_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'deposits',
  timestamps: true,
  underscored: true,
  defaultScope: {
    where: {
      deleted_at: null
    }
  },
  scopes: {
    withDeleted: {
      where: {}
    }
  }
});

export default Deposit;