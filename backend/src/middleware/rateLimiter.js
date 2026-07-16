import rateLimit from 'express-rate-limit';

// Contact form rate limiter: 5 requests per hour per IP
export const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    success: false,
    message: 'Too many contact requests from this IP, please try again after an hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to contact route
// In contactRoutes.js
import { contactRateLimiter } from '../middleware/rateLimiter.js';
router.post('/contact', contactRateLimiter, submitContactForm);