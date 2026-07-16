import jwt from 'jsonwebtoken';
import { User, UserSetting, SavingPlan, PlanMember, Deposit, Withdrawal } from '../models/Associations.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Get current user (without statistics to debug)
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    console.log('getMe called with userId:', req.userId);
    
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in request'
      });
    }

    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: UserSetting,
        as: 'settings'
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get basic user statistics (simplified)
    const statistics = await getBasicUserStatistics(req.userId);
    console.log('Profile date response sample:', { id: user.id, created_at: user.created_at, createdAt: user.createdAt });

    res.json({
      success: true,
      user: {
        ...user.toJSON(),
        statistics
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Simplified statistics function
const getBasicUserStatistics = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get total plans (owned by user)
    const totalPlans = await SavingPlan.count({
      where: { owner_id: userId }
    });

    // Get active plans
    const activePlans = await SavingPlan.count({
      where: { 
        owner_id: userId,
        status: 'active'
      }
    });

    // Get total deposits by user
    const deposits = await Deposit.findAll({
      where: { user_id: userId }
    });
    
    const totalDeposits = deposits.reduce((sum, deposit) => {
      return sum + parseFloat(deposit.amount || 0);
    }, 0);

    // Get total deposits across user's owned plans
    const ownedPlans = await SavingPlan.findAll({
      where: { owner_id: userId },
      include: [{
        model: Deposit,
        as: 'deposits'
      }]
    });
    
    let totalSaved = 0;
    ownedPlans.forEach(plan => {
      const planDeposits = plan.deposits || [];
      const planTotal = planDeposits.reduce((sum, deposit) => {
        return sum + parseFloat(deposit.amount || 0);
      }, 0);
      totalSaved += planTotal;
    });

    // Get member plans count
    const memberPlansCount = await PlanMember.count({
      where: { 
        user_id: userId,
        status: 'active'
      }
    });

    // Get user's total plans (owned + member)
    const totalUserPlans = totalPlans + memberPlansCount;

    // Get member since date
    const user = await User.findByPk(userId);
    const memberSince = user ? user.created_at : null;

    return {
      totalPlans: totalUserPlans,
      activePlans: activePlans,
      totalSaved: parseFloat(totalSaved.toFixed(2)),
      myTotalDeposits: parseFloat(totalDeposits.toFixed(2)),
      totalWithdrawn: 0, // You can implement withdrawals later
      netSavings: parseFloat(totalDeposits.toFixed(2)),
      totalDepositsCount: deposits.length,
      averageDeposit: deposits.length > 0 ? parseFloat((totalDeposits / deposits.length).toFixed(2)) : 0,
      memberSince: memberSince
    };
  } catch (error) {
    console.error('Get basic user statistics error:', error);
    // Return empty statistics instead of throwing
    return {
      totalPlans: 0,
      activePlans: 0,
      totalSaved: 0,
      myTotalDeposits: 0,
      totalWithdrawn: 0,
      netSavings: 0,
      totalDepositsCount: 0,
      averageDeposit: 0,
      memberSince: null
    };
  }
};

// @desc    Get user statistics
// @route   GET /api/auth/statistics
// @access  Private
export const getUserStatistics = async (req, res) => {
  try {
    const statistics = await calculateUserStatistics(req.userId);
    
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics'
    });
  }
};

// Helper function to calculate user statistics
const calculateUserStatistics = async (userId) => {
  try {
    // Get owned plans
    const ownedPlans = await SavingPlan.findAll({
      where: { owner_id: userId },
      include: [{
        model: Deposit,
        as: 'deposits'
      }]
    });

    // Get plans where user is an active member
    const memberPlans = await SavingPlan.findAll({
      include: [
        {
          model: PlanMember,
          as: 'members',
          where: {
            user_id: userId,
            status: 'active'
          },
          required: true
        },
        {
          model: Deposit,
          as: 'deposits'
        }
      ]
    });

    // Combine plans and remove duplicates
    const allPlanIds = new Set();
    const allPlans = [];

    ownedPlans.forEach(plan => {
      allPlanIds.add(plan.id);
      allPlans.push({
        ...plan.toJSON(),
        role: 'owner'
      });
    });

    memberPlans.forEach(plan => {
      if (!allPlanIds.has(plan.id)) {
        allPlanIds.add(plan.id);
        allPlans.push({
          ...plan.toJSON(),
          role: 'member'
        });
      }
    });

    // Calculate statistics
    let totalPlans = allPlans.length;
    let activePlans = allPlans.filter(plan => plan.status === 'active').length;
    let completedPlans = allPlans.filter(plan => plan.status === 'completed').length;
    
    // Calculate total savings
    let totalSaved = 0;
    let myDepositsTotal = 0;
    let activePlansDeposits = 0;
    
    allPlans.forEach(plan => {
      const planDeposits = plan.deposits || [];
      const planTotal = planDeposits.reduce((sum, deposit) => {
        return sum + parseFloat(deposit.amount);
      }, 0);
      
      totalSaved += planTotal;
      
      // Calculate user's deposits in this plan
      const myDepositsInPlan = planDeposits.filter(deposit => deposit.user_id === userId);
      const myPlanTotal = myDepositsInPlan.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
      myDepositsTotal += myPlanTotal;
      
      if (plan.status === 'active') {
        activePlansDeposits += planTotal;
      }
    });

    // Get total withdrawals
    const withdrawals = await Withdrawal.findAll({
      where: { user_id: userId, status: 'approved' }
    });
    
    const totalWithdrawn = withdrawals.reduce((sum, withdrawal) => {
      return sum + parseFloat(withdrawal.amount);
    }, 0);

    // Get user's created date
    const user = await User.findByPk(userId);
    const memberSince = user.created_at;

    // Calculate net savings (deposits - withdrawals)
    const netSavings = myDepositsTotal - totalWithdrawn;

    // Calculate average deposit
    const allUserDeposits = await Deposit.findAll({
      where: { user_id: userId }
    });
    
    const totalDepositsCount = allUserDeposits.length;
    const averageDeposit = totalDepositsCount > 0 ? myDepositsTotal / totalDepositsCount : 0;

    // Get recent activity (last 5 deposits)
    const recentDeposits = await Deposit.findAll({
      where: { user_id: userId },
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{
        model: SavingPlan,
        as: 'plan',
        attributes: ['id', 'plan_name']
      }]
    });

    // Get plan distribution
    const planDistribution = allPlans.reduce((acc, plan) => {
      const status = plan.status || 'unknown';
      if (!acc[status]) acc[status] = 0;
      acc[status]++;
      return acc;
    }, {});

    return {
      totalPlans,
      activePlans,
      completedPlans,
      totalSaved: parseFloat(totalSaved.toFixed(2)),
      myTotalDeposits: parseFloat(myDepositsTotal.toFixed(2)),
      totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
      netSavings: parseFloat(netSavings.toFixed(2)),
      activePlansDeposits: parseFloat(activePlansDeposits.toFixed(2)),
      averageDeposit: parseFloat(averageDeposit.toFixed(2)),
      totalDepositsCount,
      memberSince,
      planDistribution,
      recentActivity: recentDeposits.map(deposit => ({
        id: deposit.id,
        amount: deposit.amount,
        plan_name: deposit.plan?.plan_name,
        date: deposit.created_at,
        type: 'deposit'
      }))
    };
  } catch (error) {
    console.error('Calculate user statistics error:', error);
    throw error;
  }
};

// @desc    Update user profile (including profile photo)
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { username, phone, profile_picture } = req.body;
    
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    const updates = {};
    if (username !== undefined) updates.username = username;
    if (phone !== undefined) updates.phone = phone;
    if (profile_picture !== undefined) updates.profile_picture = profile_picture;
    
    await user.update(updates);

    // Get updated user with statistics
    const updatedUser = await User.findByPk(req.userId, {
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: UserSetting,
        as: 'settings'
      }]
    });

    const statistics = await calculateUserStatistics(req.userId);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        ...updatedUser.toJSON(),
        statistics
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};


// @desc    Upload profile picture
// @route   POST /api/auth/upload-photo
// @access  Private
export const uploadProfilePhoto = async (req, res) => {
  try {
    console.log('Upload profile photo request received');
    console.log('File:', req.file);
    console.log('User ID:', req.userId);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile picture if exists
    if (user.profile_picture) {
      try {
        const oldImagePath = path.join(__dirname, '..', '..', user.profile_picture.replace(/^\/+/,''));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('Deleted old profile picture:', oldImagePath);
        }
      } catch (deleteError) {
        console.error('Error deleting old profile picture:', deleteError);
        // Continue anyway - don't fail upload if delete fails
      }
    }

    // Update user's profile picture
    // Store relative path from server root
    const profilePicture = `/uploads/profile/${req.file.filename}`;
    
    console.log('Setting profile picture to:', profilePicture);
    
    await user.update({ profile_picture: profilePicture });

    // Get updated user with settings
    const updatedUser = await User.findByPk(req.userId, {
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: UserSetting,
        as: 'settings'
      }]
    });

    const statistics = await calculateUserStatistics(req.userId);

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      profile_picture: profilePicture,
      user: {
        ...updatedUser.toJSON(),
        statistics
      }
    });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading profile photo',
      error: error.message
    });
  }
};


// @desc    Update user settings (including 2FA)
// @route   PUT /api/auth/settings
// @access  Private
export const updateSettings = async (req, res) => {
  try {
    const {
      email_notifications,
      sms_notifications,
      reminder_days_before,
      currency,
      two_factor_enabled,
      language,
      theme
    } = req.body;
    
    // Find or create user settings
    let settings = await UserSetting.findOne({
      where: { user_id: req.userId }
    });

    if (!settings) {
      settings = await UserSetting.create({
        user_id: req.userId,
        email_notifications: true,
        sms_notifications: false,
        reminder_days_before: 1,
        currency: 'ZMW',
        two_factor_enabled: false
      });
    }

    // Update settings
    const updates = {};
    if (email_notifications !== undefined) updates.email_notifications = email_notifications;
    if (sms_notifications !== undefined) updates.sms_notifications = sms_notifications;
    if (reminder_days_before !== undefined) updates.reminder_days_before = reminder_days_before;
    if (currency !== undefined) updates.currency = currency;
    if (two_factor_enabled !== undefined) updates.two_factor_enabled = two_factor_enabled;
    if (language !== undefined) updates.language = language;
    if (theme !== undefined) updates.theme = theme;
    
    await settings.update(updates);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings'
    });
  }
};

// @desc    Setup 2FA
// @route   POST /api/auth/setup-2fa
// @access  Private
export const setupTwoFactorAuth = async (req, res) => {
  try {
    const { enable } = req.body;
    
    const settings = await UserSetting.findOne({
      where: { user_id: req.userId }
    });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'User settings not found'
      });
    }

    // In production, you would:
    // 1. Generate a secret key
    // 2. Create a QR code for the secret
    // 3. Verify the token
    // For now, we'll just toggle the setting
    
    settings.two_factor_enabled = Boolean(enable);
    
    if (enable) {
      // Generate a placeholder secret (in production use speakeasy or similar)
      settings.two_factor_secret = `2FA_SECRET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      settings.two_factor_backup_codes = JSON.stringify([
        'BACKUP1', 'BACKUP2', 'BACKUP3', 'BACKUP4', 'BACKUP5'
      ]);
    } else {
      settings.two_factor_secret = null;
      settings.two_factor_backup_codes = null;
    }
    
    await settings.save();

    res.json({
      success: true,
      message: enable ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled',
      settings: {
        two_factor_enabled: settings.two_factor_enabled,
        two_factor_secret: enable ? settings.two_factor_secret : undefined,
        backup_codes: enable ? JSON.parse(settings.two_factor_backup_codes) : undefined
      }
    });
  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting up two-factor authentication'
    });
  }
};

// @desc    Verify 2FA token
// @route   POST /api/auth/verify-2fa
// @access  Private
export const verifyTwoFactorToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    const settings = await UserSetting.findOne({
      where: { user_id: req.userId }
    });

    if (!settings || !settings.two_factor_enabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is not enabled'
      });
    }

    // In production, verify the token against the secret
    // For now, we'll accept any 6-digit token as valid
    const isValidToken = /^\d{6}$/.test(token);
    
    if (!isValidToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    res.json({
      success: true,
      message: 'Token verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('Verify 2FA token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying token'
    });
  }
};
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ 
      where: { email },
      include: [{
        model: UserSetting,
        as: 'settings'
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash: password,
      phone
    });

    // Create default settings for user
    await UserSetting.create({
      user_id: user.id,
      email_notifications: true,
      sms_notifications: false,
      reminder_days_before: 1,
      currency: 'ZMW'
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// @desc    Update user password
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password_hash = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password'
    });
  }
};

// @desc    Forgot password - Send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  let user = null; // Define user variable at the top
  
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
        errors: { email: 'Email is required' }
      });
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        errors: { email: 'Invalid email format' }
      });
    }

    // Check for user
    user = await User.findOne({ where: { email } });

    if (!user) {
      // For security, we don't reveal if email exists
      return res.status(200).json({ // Changed to 200 for consistency
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Import crypto dynamically if needed
    let crypto;
    try {
      crypto = await import('crypto');
    } catch (cryptoError) {
      console.error('❌ Failed to import crypto module:', cryptoError);
      return res.status(500).json({
        success: false,
        message: 'Server configuration error. Please contact support.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.reset_password_token = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token expiry (1 hour from now)
    user.reset_password_expire = new Date(Date.now() + 3600000);
    
    await user.save();

    // Create reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://savewisezm.com:3024';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    console.log(`✅ Generated reset token for ${email}: ${resetToken.substring(0, 20)}...`);
    console.log(`✅ Reset URL: ${resetUrl}`);

    // Email configuration
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    const noReplyEmail = process.env.NO_REPLY_EMAIL || emailUser;

    if (!emailUser || !emailPass) {
      console.error('❌ Email configuration missing');
      
      // Rollback the token save since email can't be sent
      user.reset_password_token = null;
      user.reset_password_expire = null;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please contact support.'
      });
    }

    console.log(`📧 Email config: User=${emailUser}, Admin=${process.env.ADMIN_EMAIL}`);

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified for password reset');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError);
      
      // Rollback the token save
      user.reset_password_token = null;
      user.reset_password_expire = null;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Email service configuration error. Please contact support.'
      });
    }

    // Email content
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1>Password Reset Request</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hello ${user.username || 'User'},</p>
          
          <p>You have requested a password reset for your SaveWise account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Your Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            <strong>Important:</strong> This link will expire in 1 hour.
          </p>
          
          <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
          
          <p style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; font-size: 12px; color: #999;">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <p>Best regards,<br>The SaveWise Team</p>
        </div>
      </div>
    `;

    // Send email
    try {
      const mailInfo = await transporter.sendMail({
        from: `"SaveWise" <${noReplyEmail}>`,
        to: user.email,
        subject: 'Password Reset Request - SaveWise',
        html: message,
        text: `Password Reset Request\n\nHello ${user.username || 'User'},\n\nYou have requested a password reset for your SaveWise account.\n\nReset Link: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this password reset, please ignore this email.\n\nBest regards,\nThe SaveWise Team`
      });

      console.log(`✅ Password reset email sent to: ${user.email}, Message ID: ${mailInfo.messageId}`);
      console.log(`✅ Reset URL sent: ${resetUrl}`);

    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      console.error('❌ Email error details:', emailError.message);
      
      // Rollback the token save
      user.reset_password_token = null;
      user.reset_password_expire = null;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.',
        debug: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }

    res.json({
      success: true,
      message: 'Password reset link has been sent to your email.'
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Clean up any partial changes
    try {
      if (user && user.id) {
        const currentUser = await User.findByPk(user.id);
        if (currentUser) {
          currentUser.reset_password_token = null;
          currentUser.reset_password_expire = null;
          await currentUser.save();
          console.log('✅ Cleaned up reset token after error');
        }
      }
    } catch (cleanupError) {
      console.error('❌ Error cleaning up reset token:', cleanupError);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request. Please try again later.',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

 // @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Import crypto dynamically
    let crypto;
    try {
      crypto = await import('crypto');
    } catch (cryptoError) {
      console.error('❌ Failed to import crypto module:', cryptoError);
      return res.status(500).json({
        success: false,
        message: 'Server configuration error. Please contact support.'
      });
    }

    // Hash token to compare with stored token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token that hasn't expired
    const user = await User.findOne({
      where: {
        reset_password_token: resetPasswordToken,
        reset_password_expire: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password_hash = password;
    user.reset_password_token = null;
    user.reset_password_expire = null;
    
    await user.save();

    console.log(`✅ Password reset successful for user: ${user.email}`);

    // Send confirmation email (if email is configured)
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    const noReplyEmail = process.env.NO_REPLY_EMAIL || emailUser;

    if (emailUser && emailPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass
          }
        });

        await transporter.sendMail({
          from: `"SaveWise" <${noReplyEmail}>`,
          to: user.email,
          subject: 'Password Changed Successfully - SaveWise',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
                <h1>Password Changed Successfully</h1>
              </div>
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Hello ${user.username || 'User'},</p>
                
                <p>Your SaveWise account password has been successfully changed.</p>
                
                <div style="background: #e6fffa; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0;">
                  <p><strong>Security Notice:</strong></p>
                  <p>This change was made on ${new Date().toLocaleString()}.</p>
                </div>
                
                <p>If you did not make this change, please contact our support team immediately.</p>
                
                <p>Best regards,<br>The SaveWise Security Team</p>
              </div>
            </div>
          `,
          text: `Password Changed Successfully\n\nHello ${user.username || 'User'},\n\nYour SaveWise account password has been successfully changed.\n\nThis change was made on ${new Date().toLocaleString()}.\n\nIf you did not make this change, please contact support immediately.\n\nBest regards,\nThe SaveWise Security Team`
        });
        
        console.log(`✅ Password change confirmation sent to: ${user.email}`);
      } catch (emailError) {
        console.error('❌ Failed to send password change confirmation:', emailError);
        // Don't fail the reset if email fails
      }
    }

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again later.',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


