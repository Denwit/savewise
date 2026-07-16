import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Reminder = sequelize.define('Reminder', {
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
  reminder_type: {
    type: DataTypes.ENUM('deposit', 'withdrawal', 'target', 'general'),
    allowNull: false,
    defaultValue: 'deposit'
  },
  reminder_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'reminders',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['reminder_date']
    },
    {
      fields: ['is_sent']
    }
  ]
});

// Instance method to check if reminder is due
Reminder.prototype.isDue = function() {
  const today = new Date().toISOString().split('T')[0];
  return this.reminder_date <= today && !this.is_sent;
};

export default Reminder;