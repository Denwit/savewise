// Add these fields to the Withdrawal model
import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Withdrawal = sequelize.define('Withdrawal', {
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
    validate: {
      min: 0
    }
  },
  interest_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  repaid_amount: {
  type: DataTypes.DECIMAL(10, 2),
  defaultValue: 0.00,
  validate: { min: 0 }
},
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid'),
    defaultValue: 'pending'
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'withdrawals',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['plan_id', 'user_id']
    },
    {
      fields: ['status']
    }
  ]
});

// Instance method to calculate interest
Withdrawal.prototype.calculateInterest = function(planInterestRate) {
  const principal = parseFloat(this.amount);
  const interestRate = parseFloat(planInterestRate) || 0;
  
  if (interestRate > 0) {
    const interestAmount = (principal * interestRate) / 100;
    return {
      interest_amount: interestAmount,
      total_amount: principal + interestAmount
    };
  }
  
  return {
    interest_amount: 0,
    total_amount: principal
  };
};

// Instance method to check if withdrawal can be processed
Withdrawal.prototype.canProcess = function() {
  return this.status === 'pending';
};

Withdrawal.prototype.remaining = function() {
  return parseFloat(this.total_amount) - parseFloat(this.repaid_amount);
};

// Instance method to approve withdrawal
Withdrawal.prototype.approve = async function(adminId, interestRate, transaction) {
  this.status = 'approved';
  this.approved_by = adminId;
  this.approved_at = new Date();
  if (interestRate > 0) {
    const calc = this.calculateInterest(interestRate);
    this.interest_amount = calc.interest_amount;
    this.total_amount = calc.total_amount;
  } else {
    this.total_amount = this.amount;
  }
  if (transaction) return await this.save({ transaction });
  return await this.save();
};

// Instance method to mark as paid
Withdrawal.prototype.markAsPaid = async function(transaction) {
  this.status = 'paid';
  this.paid_at = new Date();
  
  if (transaction) {
    return await this.save({ transaction });
  }
  return await this.save();
};

// Instance method to reject withdrawal
Withdrawal.prototype.reject = async function(reason, transaction) {
  this.status = 'rejected';
  this.rejection_reason = reason;
  
  if (transaction) {
    return await this.save({ transaction });
  }
  return await this.save();
};

export default Withdrawal;