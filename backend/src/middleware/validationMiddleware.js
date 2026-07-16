import { body, validationResult } from 'express-validator';

// Validation middleware for registration
export const validateRegistration = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation middleware for login
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation middleware for creating a plan
export const validatePlan = [
  body('plan_name')
    .trim()
    .notEmpty().withMessage('Plan name is required')
    .isLength({ min: 3 }).withMessage('Plan name must be at least 3 characters'),

  body('frequency')
    .isIn(['weekly', 'bi-weekly', 'monthly']).withMessage('Invalid frequency'),

  body('cycle')
    .optional()
    .isString().withMessage('Invalid cycle'),

  body('target_amount')
    .isFloat({ min: 0 }).withMessage('Target amount must be a positive number'),

  body('max_members')
    .optional()
    .isInt({ min: 1 }).withMessage('Max members must be at least 1'),

  body('interest_rate')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Interest rate must be between 0 and 100'),

  body('start_date')
    .isDate().withMessage('Invalid start date'),

  body('end_date')
    .isDate().withMessage('Invalid end date')
    .custom((endDate, { req }) => {
      const startDate = req.body.start_date;
      if (!startDate || new Date(endDate) <= new Date(startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];
