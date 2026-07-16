// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { User, SavingPlan, PlanMember } from '../models/Associations.js';

export const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, no token'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');

      // Get user from token
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'username', 'email', 'phone', 'is_active', 'created_at']
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      // Set user in request - SET BOTH FOR COMPATIBILITY
      req.userId = user.id;
      req.user = user;
      
      console.log('Auth middleware - User ID set:', req.userId, 'User:', req.user.username);
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, invalid token'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token expired'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Server error in authentication'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

// Helper function to get userId from request
export const getUserId = (req) => {
  console.log('Getting user ID from request:', {
    userId: req.userId,
    user: req.user ? { id: req.user.id, username: req.user.username } : 'No user'
  });
  
  // Try multiple ways to get the user ID
  if (req.userId) return req.userId;
  if (req.user && req.user.id) return req.user.id;
  if (req.userId) return req.userId; // Try again with different case
  if (req.user_id) return req.user_id;
  
  console.error('No user ID found in request');
  return null;
};

// Middleware to check if user is plan owner
export const isPlanOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const plan = await SavingPlan.findByPk(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    console.log('Plan owner check - Plan owner:', plan.owner_id, 'Current user:', userId);
    
    if (plan.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized as plan owner'
      });
    }

    req.plan = plan;
    next();
  } catch (error) {
    console.error('Is plan owner error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Middleware to check if user is plan member (owner or active member)
export const isPlanMember = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Check if user is plan owner
    const plan = await SavingPlan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    console.log('Plan member check - Plan owner:', plan.owner_id, 'Current user:', userId);
    
    if (plan.owner_id === userId) {
      req.isOwner = true;
      req.isAdmin = true;
      return next();
    }
    
    // Check if user is active member
    const member = await PlanMember.findOne({
      where: {
        plan_id: planId,
        user_id: userId,
        status: 'active'
      }
    });
    
    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this plan'
      });
    }
    
    req.isOwner = false;
    req.isAdmin = member.is_admin;
    next();
  } catch (error) {
    console.error('Is plan member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Middleware to check if user is admin (plan admin or super admin)
export const isAdmin = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // First check if user is plan admin for the specific plan
    const { planId } = req.params;
    
    if (planId) {
      const plan = await SavingPlan.findByPk(planId);
      if (plan && plan.owner_id === userId) {
        console.log('User is plan owner, granting admin access');
        return next();
      }
      
      const member = await PlanMember.findOne({
        where: {
          plan_id: planId,
          user_id: userId,
          status: 'active',
          is_admin: true
        }
      });
      
      if (member) {
        console.log('User is plan admin, granting admin access');
        return next();
      }
    }
    
    // Here you can add super admin check if you have that role
    // For now, we'll just check if user is owner of any plan
    const ownedPlan = await SavingPlan.findOne({
      where: { owner_id: userId }
    });
    
    if (ownedPlan) {
      console.log('User owns at least one plan, granting admin access');
      return next();
    }
    
    console.log('User is not authorized for admin access');
    return res.status(403).json({
      success: false,
      message: 'Not authorized, admin access required'
    });
  } catch (error) {
    console.error('Is admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Simplified middleware for invitation routes
export const requireAuth = async (req, res, next) => {
  console.log('Require auth middleware called');
  console.log('Headers:', {
    authorization: req.headers.authorization ? 'Token present' : 'No token',
    'content-type': req.headers['content-type']
  });
  
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No authentication token provided'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'email']
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Set user information
    req.user = user;
    req.userId = user.id;
    
    console.log('Auth successful for user:', user.id, user.email);
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
};