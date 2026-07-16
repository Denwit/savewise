import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const UserSetting = sequelize.define('UserSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  email_notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sms_notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminder_days_before: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 0,
      max: 7
    }
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'ZMW'
  },
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  two_factor_secret: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  two_factor_backup_codes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  language: {
    type: DataTypes.STRING(10),
    defaultValue: 'en'
  },
  theme: {
    type: DataTypes.ENUM('light', 'dark', 'system'),
    defaultValue: 'system'
  }
}, {
  tableName: 'user_settings',
  timestamps: true,
  underscored: true
});

// Instance method to get notification preferences
UserSetting.prototype.getNotificationPreferences = function() {
  return {
    email: this.email_notifications,
    sms: this.sms_notifications,
    reminder_days: this.reminder_days_before
  };
};

export default UserSetting;