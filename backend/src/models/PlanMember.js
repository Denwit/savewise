// models/PlanMember.js
import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import crypto from 'crypto';

const PlanMember = sequelize.define('PlanMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'saving_plans',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for pending invites
    references: {
      model: 'users',
      key: 'id'
    }
  },
  invited_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'rejected', 'left', 'invited'),
    defaultValue: 'pending'
  },
  invited_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  invitation_token: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  token_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  invited_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  joined_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  left_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'plan_members',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['plan_id', 'user_id'],
      unique: true
    },
    {
      fields: ['invitation_token'],
      unique: true
    },
    {
      fields: ['status']
    },
    {
      fields: ['user_id', 'status']
    },
    {
      fields: ['invited_email']
    }
  ]
});

// Instance method to generate invitation token
PlanMember.prototype.generateInvitationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 72); // Token expires in 72 hours
  
  this.invitation_token = token;
  this.token_expires = expires;
  this.status = 'invited';
  
  return token;
};

// Static method to validate token
PlanMember.validateInvitationToken = async function(token) {
  const invitation = await this.findOne({
    where: {
      invitation_token: token,
      token_expires: { [sequelize.Op.gt]: new Date() },
      status: 'invited'
    },
    include: ['plan']
  });
  
  return invitation;
};

export default PlanMember;