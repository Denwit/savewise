import { PlanMember, SavingPlan, User, Notification } from '../models/Associations.js';
import { Op } from 'sequelize';
import sequelize from '../models/index.js';

// @desc    Get all invitations for user (all statuses)
// @route   GET /api/invitations
// @access  Private
export const getInvitations = async (req, res) => {
  try {
    console.log(`Fetching invitations for user ID: ${req.userId}`);
    
    // Get all invitations for this user with different statuses
    const invitations = await PlanMember.findAll({
      where: {
        user_id: req.userId,
        status: { [Op.in]: ['pending', 'active', 'rejected', 'left'] }
      },
      include: [
        {
          model: SavingPlan,
          as: 'plan',
          attributes: ['id', 'plan_name', 'description', 'owner_id', 'target_amount', 'currency', 'status']
        },
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['invited_at', 'DESC']]
    });

    console.log(`Found ${invitations.length} invitations`);
    
    // Debug: Log each invitation
    invitations.forEach((inv, index) => {
      console.log(`Invitation ${index + 1}:`, {
        id: inv.id,
        plan_name: inv.plan?.plan_name,
        status: inv.status,
        invited_by: inv.invited_by,
        inviter_username: inv.inviter?.username,
        invited_at: inv.invited_at
      });
    });

    // Calculate stats
    const stats = {
      pending: invitations.filter(i => i.status === 'pending').length,
      active: invitations.filter(i => i.status === 'active').length,
      rejected: invitations.filter(i => i.status === 'rejected').length,
      total: invitations.length
    };

    res.json({
      success: true,
      count: invitations.length,
      stats,
      invitations: invitations.map(inv => ({
        id: inv.id,
        plan_id: inv.plan_id,
        user_id: inv.user_id,
        status: inv.status,
        is_admin: inv.is_admin,
        invited_by: inv.invited_by,
        invited_at: inv.invited_at,
        joined_at: inv.joined_at,
        left_at: inv.left_at,
        created_at: inv.created_at,
        updated_at: inv.updated_at,
        plan: inv.plan ? {
          id: inv.plan.id,
          plan_name: inv.plan.plan_name,
          description: inv.plan.description,
          owner_id: inv.plan.owner_id,
          target_amount: inv.plan.target_amount,
          currency: inv.plan.currency,
          status: inv.plan.status
        } : null,
        inviter: inv.inviter ? {
          id: inv.inviter.id,
          username: inv.inviter.username,
          email: inv.inviter.email
        } : null
      }))
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitations'
    });
  }
};

// Helper to get user ID
const getUserIdFromRequest = (req) => {
  return req.userId || (req.user && req.user.id);
};

// @desc    Get invitations by status
// @route   GET /api/invitations/status/:status
// @access  Private
export const getInvitationsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['pending', 'active', 'rejected'];
    const userId = getUserIdFromRequest(req);

     if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, active, or rejected'
      });
    }

    const invitations = await PlanMember.findAll({
      where: {
        user_id: req.userId,
        status: status
      },
      include: [
        {
          model: SavingPlan,
          as: 'plan',
          attributes: ['id', 'plan_name', 'description', 'owner_id', 'target_amount', 'currency', 'status']
        },
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['invited_at', 'DESC']]
    });

    res.json({
      success: true,
      count: invitations.length,
      status,
      invitations
    });
  } catch (error) {
    console.error('Get invitations by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitations'
    });
  }
};

// @desc    Get invitation history (with all statuses)
// @route   GET /api/invitations/history
// @access  Private
export const getInvitationHistory = async (req, res) => {
  try {
    // Get invitations received by user
    const receivedInvitations = await PlanMember.findAll({
      where: {
        user_id: req.userId
      },
      include: [
        {
          model: SavingPlan,
          as: 'plan',
          attributes: ['id', 'plan_name', 'description', 'owner_id']
        },
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['invited_at', 'DESC']]
    });

    // Get invitations sent by user
    const sentInvitations = await PlanMember.findAll({
      where: {
        invited_by: req.userId,
        user_id: { [Op.ne]: req.userId } // Don't include self-invitations
      },
      include: [
        {
          model: SavingPlan,
          as: 'plan',
          attributes: ['id', 'plan_name', 'description']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['invited_at', 'DESC']]
    });

    // Calculate stats
    const receivedStats = {
      pending: receivedInvitations.filter(i => i.status === 'pending').length,
      active: receivedInvitations.filter(i => i.status === 'active').length,
      rejected: receivedInvitations.filter(i => i.status === 'rejected').length,
      total: receivedInvitations.length
    };

    const sentStats = {
      pending: sentInvitations.filter(i => i.status === 'pending').length,
      active: sentInvitations.filter(i => i.status === 'active').length,
      rejected: sentInvitations.filter(i => i.status === 'rejected').length,
      total: sentInvitations.length
    };

    res.json({
      success: true,
      stats: {
        received: receivedStats,
        sent: sentStats,
        total: receivedInvitations.length + sentInvitations.length
      },
      invitations: {
        received: receivedInvitations.map(inv => ({
          id: inv.id,
          plan_id: inv.plan_id,
          user_id: inv.user_id,
          status: inv.status,
          invited_by: inv.invited_by,
          invited_at: inv.invited_at,
          joined_at: inv.joined_at,
          plan: inv.plan,
          inviter: inv.inviter
        })),
        sent: sentInvitations.map(inv => ({
          id: inv.id,
          plan_id: inv.plan_id,
          user_id: inv.user_id,
          status: inv.status,
          invited_by: inv.invited_by,
          invited_at: inv.invited_at,
          joined_at: inv.joined_at,
          plan: inv.plan,
          user: inv.user
        }))
      }
    });
  } catch (error) {
    console.error('Get invitation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitation history'
    });
  }
};

// @desc    Accept invitation
// @route   PUT /api/invitations/:id/accept
// @access  Private
export const acceptInvitation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const invitation = await PlanMember.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId,
        status: 'pending'
      },
      include: [
        {
          model: SavingPlan,
          as: 'plan'
        },
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'username', 'email']
        }
      ],
      transaction
    });

    if (!invitation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or already processed'
      });
    }

    // Check if plan is still active
    if (invitation.plan.status !== 'active') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'This plan is no longer active'
      });
    }

    // Update invitation status
    invitation.status = 'active';
    invitation.joined_at = new Date();
    await invitation.save({ transaction });

    // Get current user info
    const currentUser = await User.findByPk(req.userId, { transaction });

    // Create notification for plan owner
    await Notification.create({
      user_id: invitation.plan.owner_id,
      title: 'Invitation Accepted',
      message: `${currentUser.username || 'A user'} has accepted your invitation to join "${invitation.plan.plan_name}"`,
      type: 'success',
      link: `/plans/${invitation.plan.id}`
    }, { transaction });

    await transaction.commit();

    // Get updated invitation with all relationships
    const updatedInvitation = await PlanMember.findByPk(invitation.id, {
      include: [
        {
          model: SavingPlan,
          as: 'plan',
          attributes: ['id', 'plan_name', 'description']
        },
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      invitation: updatedInvitation
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting invitation'
    });
  }
};

// @desc    Reject invitation
// @route   PUT /api/invitations/:id/reject
// @access  Private
export const rejectInvitation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const invitation = await PlanMember.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId,
        status: 'pending'
      },
      include: [
        {
          model: SavingPlan,
          as: 'plan'
        },
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'username', 'email']
        }
      ],
      transaction
    });

    if (!invitation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or already processed'
      });
    }

    // Update invitation status
    invitation.status = 'rejected';
    await invitation.save({ transaction });

    // Get current user info
    const currentUser = await User.findByPk(req.userId, { transaction });

    // Create notification for plan owner
    await Notification.create({
      user_id: invitation.plan.owner_id,
      title: 'Invitation Rejected',
      message: `${currentUser.username || 'A user'} has declined your invitation to join "${invitation.plan.plan_name}"`,
      type: 'warning',
      link: `/plans/${invitation.plan.id}`
    }, { transaction });

    await transaction.commit();

    // Get updated invitation
    const updatedInvitation = await PlanMember.findByPk(invitation.id, {
      include: [
        {
          model: SavingPlan,
          as: 'plan'
        },
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Invitation rejected',
      invitation: updatedInvitation
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Reject invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting invitation'
    });
  }
};

// @desc    Send invitation to user
// @route   POST /api/invitations
// @access  Private
export const sendInvitation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { plan_id, user_email, user_id } = req.body;

    // Check if plan exists and user is owner or admin
    const plan = await SavingPlan.findByPk(plan_id, { 
      transaction,
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'username']
      }]
    });
    
    if (!plan) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if user is plan owner or admin
    const isMember = await PlanMember.findOne({
      where: {
        plan_id: plan.id,
        user_id: req.userId
      },
      transaction
    });

    if (plan.owner_id !== req.userId && (!isMember || !isMember.is_admin)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to invite users to this plan'
      });
    }

    // Find user by email or ID
    let user;
    if (user_email) {
      user = await User.findOne({
        where: { email: user_email },
        transaction
      });
      
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'User not found with this email'
        });
      }
    } else if (user_id) {
      user = await User.findByPk(user_id, { 
        transaction,
        attributes: ['id', 'username', 'email']
      });
      
      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    } else {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Please provide either user_email or user_id'
      });
    }

    // Check if user is already a member
    const existingMember = await PlanMember.findOne({
      where: {
        plan_id,
        user_id: user.id
      },
      transaction
    });

    if (existingMember) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this plan'
      });
    }

    // Check if plan has reached max members
    const currentMembers = await PlanMember.count({
      where: {
        plan_id,
        status: { [Op.in]: ['active', 'pending'] }
      },
      transaction
    });

    if (currentMembers >= plan.max_members) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Plan has reached maximum number of members'
      });
    }

    // Get current user info
    const currentUser = await User.findByPk(req.userId, { 
      transaction,
      attributes: ['id', 'username']
    });

    // Create invitation
    const invitation = await PlanMember.create({
      plan_id,
      user_id: user.id,
      is_admin: false,
      status: 'pending',
      invited_by: req.userId,
      invited_at: new Date()
    }, { transaction });

    // Create notification for invited user
    await Notification.create({
      user_id: user.id,
      title: 'Plan Invitation',
      message: `You have been invited to join "${plan.plan_name}" by ${currentUser.username || 'a user'}`,
      type: 'info',
      link: `/invitations`
    }, { transaction });

    await transaction.commit();

    // Get created invitation with relationships
    const createdInvitation = await PlanMember.findByPk(invitation.id, {
      include: [
        {
          model: SavingPlan,
          as: 'plan',
          attributes: ['id', 'plan_name']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'username']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: createdInvitation
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Send invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending invitation'
    });
  }
};

// @desc    Get invitations count
// @route   GET /api/invitations/count
// @access  Private
export const getInvitationsCount = async (req, res) => {
  try {
    const invitations = await PlanMember.findAll({
      where: {
        user_id: req.userId,
        status: { [Op.in]: ['pending', 'active', 'rejected'] }
      },
      attributes: ['status']
    });

    const stats = {
      pending: invitations.filter(i => i.status === 'pending').length,
      active: invitations.filter(i => i.status === 'active').length,
      rejected: invitations.filter(i => i.status === 'rejected').length,
      total: invitations.length
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get invitations count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitation counts'
    });
  }
};

// @desc    Get invitation by ID
// @route   GET /api/invitations/:id
// @access  Private
export const getInvitationById = async (req, res) => {
  try {
    const invitation = await PlanMember.findOne({
      where: {
        id: req.params.id,
        user_id: req.userId
      },
      include: [
        {
          model: SavingPlan,
          as: 'plan',
          include: [{
            model: User,
            as: 'owner',
            attributes: ['id', 'username', 'email']
          }]
        },
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    res.json({
      success: true,
      invitation
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitation'
    });
  }
};
// @desc    Cancel invitation
// @route   DELETE /api/invitations/:id
// @access  Private
export const cancelInvitation = async (req, res) => {
  try {
    const invitation = await PlanMember.findOne({
      where: {
        id: req.params.id,
        invited_by: req.userId,
        status: 'pending'
      },
      include: [{
        model: SavingPlan,
        as: 'plan'
      }]
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or already processed'
      });
    }

    await invitation.destroy();

    res.json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling invitation'
    });
  }
};

// @desc    Get pending invitations count
// @route   GET /api/invitations/pending-count
// @access  Private
export const getPendingCount = async (req, res) => {
  try {
    const [result] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM plan_members 
      WHERE user_id = :userId 
      AND status = 'pending'
    `, {
      replacements: { userId: req.userId },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      count: result.count
    });
  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending count'
    });
  }
};
// @desc    Get pending invitations for user
// @route   GET /api/invitations/pending
// @access  Private
export const getPendingInvitations = async (req, res) => {
  try {
    //console.log(`Fetching pending invitations for user ID: ${req.userId}`);
    
    // First, check if there are any pending invitations in the database
    const rawInvitations = await sequelize.query(`
      SELECT 
        pm.*,
        sp.plan_name,
        sp.description,
        sp.owner_id,
        sp.target_amount,
        sp.currency,
        sp.status as plan_status,
        inv.username as inviter_username,
        inv.email as inviter_email
      FROM plan_members pm
      LEFT JOIN saving_plans sp ON pm.plan_id = sp.id
      LEFT JOIN users inv ON pm.invited_by = inv.id
      WHERE pm.user_id = :userId
      AND pm.status = 'pending'
      ORDER BY pm.invited_at DESC
    `, {
      replacements: { userId: req.userId },
      type: sequelize.QueryTypes.SELECT
    });

    //console.log(`Found ${rawInvitations.length} raw invitations from database`);

    // Format the response
    const invitations = rawInvitations.map(inv => ({
      id: inv.id,
      plan_id: inv.plan_id,
      user_id: inv.user_id,
      status: inv.status,
      invited_by: inv.invited_by,
      invited_at: inv.invited_at,
      created_at: inv.created_at,
      updated_at: inv.updated_at,
      plan: {
        id: inv.plan_id,
        plan_name: inv.plan_name,
        description: inv.description,
        owner_id: inv.owner_id,
        target_amount: inv.target_amount,
        currency: inv.currency,
        status: inv.plan_status
      },
      inviter: inv.invited_by ? {
        id: inv.invited_by,
        username: inv.inviter_username,
        email: inv.inviter_email
      } : null
    }));

    //console.log(`Formatted ${invitations.length} invitations for response`);

    res.json({
      success: true,
      count: invitations.length,
      invitations
    });
  } catch (error) {
    console.error('Get pending invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitations'
    });
  }
};

// @desc    Search users for invitation
// @route   GET /api/invitations/search-users
// @access  Private
export const searchUsersToInvite = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search || search.length < 2) {
      return res.json({
        success: true,
        users: []
      });
    }

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ],
        id: { [Op.ne]: req.userId } // Exclude current user
      },
      attributes: ['id', 'username', 'email', 'created_at'],
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