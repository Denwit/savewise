import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const ContactMessage = sequelize.define('ContactMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reference_id: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  subject: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed'),
    defaultValue: 'pending'
  },
  user_email_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  admin_email_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'contact_messages',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['reference_id']
    },
    {
      fields: ['email']
    },
    {
      fields: ['created_at']
    }
  ]
});

export default ContactMessage;