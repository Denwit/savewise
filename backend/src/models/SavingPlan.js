import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const SavingPlan = sequelize.define('SavingPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  plan_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  frequency: {
    type: DataTypes.ENUM('weekly', 'bi-weekly', 'monthly'),
    allowNull: false
  },
  cycle: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  target_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  max_members: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  interest_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  is_fixed_amount: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  fixed_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  withdrawal_multiplier: {
  type: DataTypes.DECIMAL(5, 2),
  defaultValue: 1.00,
  validate: { min: 0 }
},
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'ZMW'
  },
  allow_early_withdrawals: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
},
auto_approval: {
  type: DataTypes.BOOLEAN,
  defaultValue: true
},
reminder_settings: {
  type: DataTypes.JSON,
  defaultValue: {
    enabled: true,
    days_before: 2
  }
},
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled', 'pending'),
    defaultValue: 'active'
  }
}, {
  tableName: 'saving_plans',
  timestamps: true,
  underscored: true
});

export default SavingPlan;