import { PlanMember, SavingPlan, User, Notification } from '../models/Associations.js';
import sequelize from '../models/index.js';
import crypto from 'crypto';
import { Op } from 'sequelize';
import EmailService from '../utils/emailService.js'; // Import the EmailService

// Helper to get user ID
const getUserIdFromRequest = (req) => {
  return req.userId || (req.user && req.user.id);
};

// @desc    Generate invitation link for external users
// @route   POST /api/plans/:id/invite-external
// @access  Private
export const generateInvitationLink = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { email, phone, name, channel } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : null;
    const normalizedPhone = phone ? phone.toString().replace(/[^0-9+]/g, '') : null;

    console.log('generateInvitationLink - req.params:', req.params);
    console.log('generateInvitationLink - id:', id);
    console.log('generateInvitationLink - email:', normalizedEmail);
    console.log('generateInvitationLink - phone:', normalizedPhone);
    
    
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Check if plan exists
    const plan = await SavingPlan.findByPk(id, { transaction });
    if (!plan) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    // Check if user has permission
    const isOwner = plan.owner_id === userId;
    const isAdminMember = await PlanMember.findOne({
      where: {
        plan_id: id,
        user_id: userId,
        is_admin: true,
        status: 'active'
      },
      transaction
    });
    
    if (!isOwner && !isAdminMember) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to invite users to this plan'
      });
    }
    
    // Check if plan has reached max members
    const currentMembers = await PlanMember.count({
      where: {
        plan_id: id,
        status: { [Op.in]: ['active', 'pending', 'invited'] }
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
    
    const inviteChannel = channel || (normalizedPhone ? 'whatsapp' : normalizedEmail ? 'email' : 'manual');
    if (!normalizedEmail && !normalizedPhone && inviteChannel !== 'manual') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Enter an email address, WhatsApp phone number, or choose manual link'
      });
    }
    
    // Check if user exists with this email
    const existingUser = normalizedEmail ? await User.findOne({
      where: { email: normalizedEmail },
      transaction
    }) : null;
    
    // Check if contact is already invited or a member
    const inviteChecks = [];
    if (normalizedEmail) inviteChecks.push({ invited_email: normalizedEmail });
    if (normalizedPhone) inviteChecks.push({ invited_phone: normalizedPhone });
    const whereCondition = {
      plan_id: id,
      [Op.or]: inviteChecks,
      status: { [Op.in]: ['pending', 'active', 'invited'] }
    };
    
    if (existingUser) {
      whereCondition[Op.or].push({ user_id: existingUser.id });
    }
    
    const existingInvite = await PlanMember.findOne({
      where: whereCondition,
      transaction
    });
    
    if (existingInvite) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'This person has already been invited to this plan'
      });
    }
    
    // Get current user info
    const currentUser = await User.findByPk(userId, { 
      transaction,
      attributes: ['id', 'username', 'email']
    });
    
    // Create invitation
    const invitation = await PlanMember.create({
      plan_id: id,
      invited_email: normalizedEmail,
      user_id: existingUser ? existingUser.id : null,
      is_admin: false,
      status: 'invited',
      invited_by: userId,
      invited_at: new Date()
    }, { transaction });
    
    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 72); // Token expires in 72 hours
    
    invitation.invitation_token = token;
    invitation.token_expires = expires;
    await invitation.save({ transaction });
    
    // Create invitation link
    const baseUrl = process.env.FRONTEND_URL || 'http://savewisezm.com:3024';
    const invitationLink = `${baseUrl}/invitation/accept/${token}`;
    
    await transaction.commit();
    
    console.log('Invitation link generated:', invitationLink);
    
    // Send invitation email only when this invite was created with an email.
    if (normalizedEmail) {
      try {
        await EmailService.sendInvitationEmail(
          normalizedEmail,
          plan.plan_name,
          currentUser.username,
          invitationLink
        );
        console.log('Invitation email sent successfully');
      } catch (emailError) {
        console.warn('Failed to send invitation email:', emailError);
        // Don't fail the whole request if email fails
      }
    }
    
    res.status(201).json({
      success: true,
      message: inviteChannel === 'whatsapp' ? 'WhatsApp invitation link generated successfully' : inviteChannel === 'manual' ? 'Invitation link generated successfully' : 'Invitation link generated and email sent successfully',
      data: {
        invitation_link: invitationLink,
        invitation: {
          id: invitation.id,
          email: invitation.invited_email,
          phone: invitation.invited_phone,
          channel: inviteChannel,
          expires_at: invitation.token_expires,
          status: invitation.status
        }
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Generate invitation link error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating invitation link'
    });
  }
};

// @desc    Get invitation details by token (public)
// @route   GET /api/invitation/:token
// @access  Public
export const getInvitationByToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log('Fetching invitation for token:', token);
    
    const invitation = await PlanMember.findOne({
      where: {
        invitation_token: token,
        token_expires: { [Op.gt]: new Date() },
        status: 'invited'
      },
      include: [
        {
          model: SavingPlan,
          as: 'plan',
          attributes: ['id', 'plan_name', 'description', 'owner_id', 'target_amount', 'currency', 'max_members']
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
        message: 'Invitation not found or expired'
      });
    }
    
    res.json({
      success: true,
      data: {
        invitation: {
          id: invitation.id,
          email: invitation.invited_email,
          expires_at: invitation.token_expires,
          plan: invitation.plan,
          inviter: invitation.inviter
        }
      }
    });
    
  } catch (error) {
    console.error('Get invitation by token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitation'
    });
  }
};

// @desc    Accept invitation (for logged in users)
// @route   POST /api/invitation/:token/accept
// @access  Private
export const acceptInvitationByToken = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { token } = req.params;
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    console.log('Accepting invitation for token:', token, 'User ID:', userId);
    
    // Find invitation
    const invitation = await PlanMember.findOne({
      where: {
        invitation_token: token,
        token_expires: { [Op.gt]: new Date() },
        status: 'invited'
      },
      include: [
        {
          model: SavingPlan,
          as: 'plan'
        }
      ],
      transaction
    });
    
    if (!invitation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or expired'
      });
    }
    
    // Get user
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Compare emails in lowercase to handle case differences
    if (user.email.toLowerCase() !== invitation.invited_email.toLowerCase()) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: `This invitation is for ${invitation.invited_email}, but you are logged in as ${user.email}. Please log out and log in with the correct email to accept this invitation.`
      });
    }
    
    // Update invitation
    invitation.user_id = userId;
    invitation.status = 'active';
    invitation.joined_at = new Date();
    invitation.invitation_token = null;
    invitation.token_expires = null;
    
    await invitation.save({ transaction });
    
    // Create notification for plan owner
    await Notification.create({
      user_id: invitation.plan.owner_id,
      title: 'Invitation Accepted',
      message: `${user.username} has accepted your invitation to join "${invitation.plan.plan_name}"`,
      type: 'success',
      link: `/plans/${invitation.plan.id}`
    }, { transaction });
    
    // Send email to plan owner about accepted invitation
    try {
      const planOwner = await User.findByPk(invitation.plan.owner_id, { 
        transaction,
        attributes: ['email']
      });
      
      if (planOwner) {
        await EmailService.sendInvitationAcceptedEmail(
          planOwner.email,
          user.username,
          invitation.plan.plan_name
        );
      }
    } catch (emailError) {
      console.warn('Failed to send invitation accepted email:', emailError);
      // Don't fail the transaction if email fails
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Successfully joined the plan!',
      data: {
        plan_id: invitation.plan.id,
        plan_name: invitation.plan.plan_name
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Accept invitation by token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting invitation'
    });
  }
};

// @desc    Get pending external invitations for a plan
// @route   GET /api/plans/:id/pending-invitations
// @access  Private
export const getPendingExternalInvitations = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Use req.userId or fall back to req.user.id
    const userId = req.userId || (req.user && req.user.id);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    console.log('Fetching pending invitations for plan:', id, 'User ID:', userId);
    
    // Check if plan exists
    const plan = await SavingPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    // Check if user has permission
    const isOwner = plan.owner_id === userId;
    const isAdminMember = await PlanMember.findOne({
      where: {
        plan_id: id,
        user_id: userId,
        is_admin: true,
        status: 'active'
      }
    });
    
    if (!isOwner && !isAdminMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view invitations'
      });
    }
    
    const pendingInvitations = await PlanMember.findAll({
      where: {
        plan_id: id,
        status: 'invited',
        user_id: null // Only external invitations
      },
      include: [
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['invited_at', 'DESC']]
    });
    
    console.log('Found pending invitations:', pendingInvitations.length);
    
    res.json({
      success: true,
      data: {
        invitations: pendingInvitations.map(inv => ({
          id: inv.id,
          email: inv.invited_email,
          invited_by: inv.inviter?.username,
          invited_at: inv.invited_at,
          expires_at: inv.token_expires
        }))
      }
    });
    
  } catch (error) {
    console.error('Get pending external invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending invitations'
    });
  }
};

// @desc    Cancel external invitation
// @route   DELETE /api/invitations/external/:id
// @access  Private
export const cancelExternalInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Use req.userId or fall back to req.user.id
    const userId = req.userId || (req.user && req.user.id);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    console.log('Cancelling invitation:', id, 'User ID:', userId);
    
    const invitation = await PlanMember.findOne({
      where: {
        id,
        status: 'invited',
        invited_by: userId
      }
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
    console.error('Cancel external invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling invitation'
    });
  }
};