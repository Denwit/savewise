import { UserSetting, User } from '../models/Associations.js';

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req, res) => {
  try {
    let settings = await UserSetting.findOne({
      where: { user_id: req.userId }
    });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await UserSetting.create({
        user_id: req.userId,
        email_notifications: true,
        sms_notifications: false,
        reminder_days_before: 1,
        currency: 'ZMW',
        theme: 'light',
        language: 'en'
      });
    }

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings'
    });
  }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
export const updateSettings = async (req, res) => {
  try {
    const {
      email_notifications,
      sms_notifications,
      reminder_days_before,
      currency,
      theme,
      language
    } = req.body;

    let settings = await UserSetting.findOne({
      where: { user_id: req.userId }
    });

    if (!settings) {
      // Create settings if they don't exist
      settings = await UserSetting.create({
        user_id: req.userId,
        email_notifications,
        sms_notifications,
        reminder_days_before,
        currency,
        theme,
        language
      });
    } else {
      // Update existing settings
      await settings.update({
        email_notifications,
        sms_notifications,
        reminder_days_before,
        currency,
        theme,
        language
      });
    }

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