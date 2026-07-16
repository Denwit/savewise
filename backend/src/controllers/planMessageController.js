import { Op } from 'sequelize';
import { PlanMessage, SavingPlan, PlanMember, User } from '../models/Associations.js';

const canAccessPlan = async (planId, userId) => {
  const plan = await SavingPlan.findByPk(planId);
  if (!plan) return { allowed: false, status: 404, message: 'Plan not found' };
  if (plan.owner_id === userId) return { allowed: true, plan };

  const member = await PlanMember.findOne({
    where: { plan_id: planId, user_id: userId, status: 'active' }
  });

  if (!member) {
    return { allowed: false, status: 403, message: 'Only active plan members can use this chat' };
  }

  return { allowed: true, plan, member };
};

export const getPlanMessages = async (req, res) => {
  try {
    const planId = Number(req.params.id);
    const access = await canAccessPlan(planId, req.userId);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const limit = Math.min(Number(req.query.limit) || 80, 150);
    const beforeId = Number(req.query.before_id || 0);
    const where = { plan_id: planId };
    if (beforeId > 0) where.id = { [Op.lt]: beforeId };

    const messages = await PlanMessage.findAll({
      where,
      limit,
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'profile_picture'] }],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    console.error('Get plan messages error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching chat messages' });
  }
};

export const sendPlanMessage = async (req, res) => {
  try {
    const planId = Number(req.params.id);
    const text = (req.body.message || '').toString().trim();

    if (!text) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    if (text.length > 2000) {
      return res.status(400).json({ success: false, message: 'Message is too long' });
    }

    const access = await canAccessPlan(planId, req.userId);
    if (!access.allowed) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const message = await PlanMessage.create({
      plan_id: planId,
      user_id: req.userId,
      message: text,
      message_type: 'text'
    });

    const created = await PlanMessage.findByPk(message.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'profile_picture'] }]
    });

    res.status(201).json({ success: true, message: created });
  } catch (error) {
    console.error('Send plan message error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error sending chat message' });
  }
};

