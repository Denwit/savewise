import { User, PlanMember, SavingPlan, Notification } from '../models/Associations.js';
import { Op } from 'sequelize';

// @desc    Search users for invitation
// @route   GET /api/members/search
// @access  Private
export const searchUsers = async (req, res) => {
  try {
    const { query, excludePlanId } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        users: []
      });
    }

    // Build search conditions
    const searchConditions = {
      [Op.or]: [
        { username: { [Op.like]: `%${query}%` } },
        { email: { [Op.like]: `%${query}%` } }
      ],
      id: { [Op.ne]: req.userId } // Exclude current user
    };

    // If excludePlanId is provided, exclude existing members of that plan
    if (excludePlanId) {
      const existingMembers = await PlanMember.findAll({
        where: { plan_id: excludePlanId },
        attributes: ['user_id']
      });

      const existingMemberIds = existingMembers.map(m => m.user_id);
      if (existingMemberIds.length > 0) {
        searchConditions.id[Op.notIn] = existingMemberIds;
      }
    }

    const users = await User.findAll({
      where: searchConditions,
      attributes: ['id', 'username', 'email'],
      limit: 10
    });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users'
    });
  }
};

// @desc    Invite user to plan
// @route   POST /api/plans/:planId/invite
// @access  Private
export const inviteUser = async (req, res) => {
  try {
    const { planId } = req.params;
    const { userId, email } = req.body;

    // Find the plan
    const plan = await SavingPlan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if user is plan owner or admin
    const isAdmin = await PlanMember.findOne({
      where: {
        plan_id: planId,
        user_id: req.userId,
        is_admin: true
      }
    });

    if (!isAdmin && plan.owner_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to invite members'
      });
    }

    // Check if plan has reached max members
    const currentMembers = await PlanMember.count({
      where: { plan_id: planId, status: 'active' }
    });

    if (currentMembers >= plan.max_members) {
      return res.status(400).json({
        success: false,
        message: 'Plan has reached maximum number of members'
      });
    }

    let invitedUser;
    
    // Find user by ID or email
    if (userId) {
      invitedUser = await User.findByPk(userId);
    } else if (email) {
      invitedUser = await User.findOne({ where: { email } });
    }

    if (!invitedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a member
    const existingMember = await PlanMember.findOne({
      where: {
        plan_id: planId,
        user_id: invitedUser.id
      }
    });

    if (existingMember) {
      if (existingMember.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this plan'
        });
      } else if (existingMember.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'User has already been invited to this plan'
        });
      }
    }

    // Create invitation
    const invitation = await PlanMember.create({
      plan_id: planId,
      user_id: invitedUser.id,
      is_admin: false,
      status: 'pending'
    });

    // Create notification for invited user
    await Notification.create({
      user_id: invitedUser.id,
      title: 'Plan Invitation',
      message: `You have been invited to join the saving plan "${plan.plan_name}"`,
      type: 'info',
      link: `/plans/${planId}`
    });

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      invitation
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending invitation'
    });
  }
};

// @desc    Respond to invitation
// @route   PUT /api/plans/:planId/invite/respond
// @access  Private
export const respondToInvitation = async (req, res) => {
  try {
    const { planId } = req.params;
    const { accept } = req.body;

    const invitation = await PlanMember.findOne({
      where: {
        plan_id: planId,
        user_id: req.userId,
        status: 'pending'
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'No pending invitation found'
      });
    }

    if (accept) {
      // Check if plan still has space
      const plan = await SavingPlan.findByPk(planId);
      const currentMembers = await PlanMember.count({
        where: { plan_id: planId, status: 'active' }
      });

      if (currentMembers >= plan.max_members) {
        return res.status(400).json({
          success: false,
          message: 'Plan is now full'
        });
      }

      await invitation.update({ status: 'active' });
      
      // Create notification for plan owner
      const user = await User.findByPk(req.userId);
      await Notification.create({
        user_id: plan.owner_id,
        title: 'New Member Joined',
        message: `${user.username} has accepted your invitation and joined "${plan.plan_name}"`,
        type: 'success',
        link: `/plans/${planId}`
      });

      res.json({
        success: true,
        message: 'You have joined the plan successfully'
      });
    } else {
      await invitation.destroy();
      res.json({
        success: true,
        message: 'Invitation declined'
      });
    }
  } catch (error) {
    console.error('Respond to invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to invitation'
    });
  }
};

// @desc    Remove member from plan
// @route   DELETE /api/plans/:planId/members/:userId
// @access  Private
export const removeMember = async (req, res) => {
  try {
    const { planId, userId } = req.params;

    const plan = await SavingPlan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if user is plan owner or admin
    const isAdmin = await PlanMember.findOne({
      where: {
        plan_id: planId,
        user_id: req.userId,
        is_admin: true
      }
    });

    if (!isAdmin && plan.owner_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove members'
      });
    }

    // Cannot remove plan owner
    if (plan.owner_id === parseInt(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove plan owner'
      });
    }

    const member = await PlanMember.findOne({
      where: {
        plan_id: planId,
        user_id: userId
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    await member.destroy();

    // Create notification for removed user
    await Notification.create({
      user_id: userId,
      title: 'Removed from Plan',
      message: `You have been removed from the saving plan "${plan.plan_name}"`,
      type: 'warning'
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing member'
    });
  }
};

// @desc    Update member role
// @route   PUT /api/plans/:planId/members/:userId/role
// @access  Private
export const updateMemberRole = async (req, res) => {
  try {
    const { planId, userId } = req.params;
    const { is_admin } = req.body;

    const plan = await SavingPlan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Only plan owner can update roles
    if (plan.owner_id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only plan owner can update member roles'
      });
    }

    const member = await PlanMember.findOne({
      where: {
        plan_id: planId,
        user_id: userId
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    await member.update({ is_admin });

    res.json({
      success: true,
      message: `Member role updated to ${is_admin ? 'admin' : 'member'}`,
      member
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating member role'
    });
  }
};