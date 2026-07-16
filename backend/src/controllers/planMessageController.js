import { Op } from 'sequelize';
import { PlanMessage, SavingPlan, PlanMember, User, Notification } from '../models/Associations.js';

const uniqueIds = (values) => [...new Set(values.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))];

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

const getPlanParticipantIds = async (plan) => {
  const members = await PlanMember.findAll({
    where: { plan_id: plan.id, status: 'active', user_id: { [Op.ne]: null } },
    attributes: ['user_id'],
    raw: true
  });
  return uniqueIds([plan.owner_id, ...members.map((member) => member.user_id)]);
};

const decorateMessage = (message, currentUserId) => {
  const row = message.toJSON ? message.toJSON() : message;
  const deliveredTo = uniqueIds(row.delivered_to || []);
  const readBy = uniqueIds(row.read_by || []);
  const isMine = Number(row.user_id) === Number(currentUserId);
  const otherReadCount = readBy.filter((id) => id !== Number(currentUserId)).length;
  const otherDeliveredCount = deliveredTo.filter((id) => id !== Number(currentUserId)).length;
  return {
    ...row,
    delivered_to: deliveredTo,
    read_by: readBy,
    is_mine: isMine,
    is_read_by_me: isMine || readBy.includes(Number(currentUserId)),
    delivery_status: isMine
      ? otherReadCount > 0
        ? 'read'
        : otherDeliveredCount > 0
          ? 'delivered'
          : 'sent'
      : readBy.includes(Number(currentUserId))
        ? 'read'
        : 'unread'
  };
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

    const ordered = messages.reverse();
    const currentUserId = Number(req.userId);
    const messagesToMark = ordered.filter((message) => {
      const row = message.toJSON();
      return Number(row.user_id) !== currentUserId && !uniqueIds(row.read_by || []).includes(currentUserId);
    });

    await Promise.all(messagesToMark.map((message) => {
      message.read_by = uniqueIds([...(message.read_by || []), currentUserId]);
      return message.save();
    }));

    res.json({ success: true, messages: ordered.map((message) => decorateMessage(message, currentUserId)) });
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

    const currentUser = await User.findByPk(req.userId, { attributes: ['id', 'username'] });
    const participantIds = await getPlanParticipantIds(access.plan);
    const recipientIds = participantIds.filter((id) => id !== Number(req.userId));

    const message = await PlanMessage.create({
      plan_id: planId,
      user_id: req.userId,
      message: text,
      message_type: 'text',
      delivered_to: recipientIds,
      read_by: [Number(req.userId)]
    });

    await Promise.all(recipientIds.map((recipientId) => Notification.create({
      user_id: recipientId,
      title: 'New message in ' + access.plan.plan_name,
      message: (currentUser?.username || 'A member') + ': ' + text.slice(0, 160),
      type: 'info',
      link: '/plans/' + planId + '?tab=chat',
      metadata: {
        item_type: 'plan_message',
        plan_id: planId,
        message_id: message.id,
        sender_id: Number(req.userId)
      }
    })));

    const created = await PlanMessage.findByPk(message.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'profile_picture'] }]
    });

    res.status(201).json({ success: true, message: decorateMessage(created, Number(req.userId)) });
  } catch (error) {
    console.error('Send plan message error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error sending chat message' });
  }
};
