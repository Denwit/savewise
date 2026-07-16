import { User } from '../models/Associations.js';

export const validateEmailExists = async (email) => {
  try {
    if (!email) {
      return {
        exists: false,
        valid: false,
        message: 'Email is required'
      };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        exists: false,
        valid: false,
        message: 'Invalid email format'
      };
    }

    // Check if email exists in database
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'username', 'is_active']
    });

    if (!user) {
      return {
        exists: false,
        valid: true,
        message: 'Email not found in database'
      };
    }

    if (!user.is_active) {
      return {
        exists: true,
        valid: false,
        message: 'Account is deactivated',
        user: user.toJSON()
      };
    }

    return {
      exists: true,
      valid: true,
      message: 'Email exists and account is active',
      user: user.toJSON()
    };
  } catch (error) {
    console.error('Email validation error:', error);
    return {
      exists: false,
      valid: false,
      message: 'Error validating email'
    };
  }
};