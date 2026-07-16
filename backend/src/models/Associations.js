import User from './User.js';
import SavingPlan from './SavingPlan.js';
import PlanMember from './PlanMember.js';
import Deposit from './Deposit.js';
import Withdrawal from './Withdrawal.js';
import Reminder from './Reminder.js';
import Notification from './Notification.js';
import UserSetting from './UserSetting.js';
import ContactMessage from './ContactMessage.js';

// User associations
User.hasMany(SavingPlan, { foreignKey: 'owner_id', as: 'ownedPlans' });
User.hasMany(PlanMember, { foreignKey: 'user_id', as: 'memberships' });
User.hasMany(Deposit, { foreignKey: 'user_id', as: 'deposits' });
User.hasMany(Withdrawal, { foreignKey: 'user_id', as: 'withdrawals' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
User.hasOne(UserSetting, { foreignKey: 'user_id', as: 'settings' });
User.hasMany(PlanMember, { foreignKey: 'user_id', as: 'planMemberships' });
User.hasMany(PlanMember, { foreignKey: 'invited_by', as: 'sentInvitations' });

// SavingPlan associations
SavingPlan.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
SavingPlan.hasMany(PlanMember, { foreignKey: 'plan_id', as: 'members' });
SavingPlan.hasMany(Deposit, { foreignKey: 'plan_id', as: 'deposits' });
SavingPlan.hasMany(Withdrawal, { foreignKey: 'plan_id', as: 'withdrawals' });
SavingPlan.hasMany(Reminder, { foreignKey: 'plan_id', as: 'reminders' });

// PlanMember associations
PlanMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
PlanMember.belongsTo(SavingPlan, { foreignKey: 'plan_id', as: 'plan' });
PlanMember.belongsTo(User, { foreignKey: 'invited_by', as: 'inviter' });

// Reminder associations
Reminder.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Reminder.belongsTo(SavingPlan, { foreignKey: 'plan_id', as: 'plan' });


// Deposit associations
Deposit.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Deposit.belongsTo(SavingPlan, { foreignKey: 'plan_id', as: 'plan' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// UserSetting associations
UserSetting.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Withdrawal associations
Withdrawal.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Withdrawal.belongsTo(SavingPlan, { foreignKey: 'plan_id', as: 'plan' });
Withdrawal.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
export {
  User,
  SavingPlan,
  PlanMember,
  Deposit,
  Withdrawal,
  Reminder,
  Notification,
  UserSetting
};