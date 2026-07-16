import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  register, 
  login, 
  getMe, 
  updateProfile,
  updatePassword,
  getUserStatistics,
  uploadProfilePhoto,
  updateSettings,
  setupTwoFactorAuth,
  verifyTwoFactorToken,
  forgotPassword, // Add this
  resetPassword   // Add this
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { 
  validateRegistration, 
  validateLogin 
} from '../middleware/validationMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/profile/');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `profile-${req.userId}-${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
    }
  }
});

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', forgotPassword); // Add this
router.put('/reset-password/:token', resetPassword); // Add this

// Protected routes
router.use(protect);

router.get('/me', getMe);
router.get('/statistics', getUserStatistics);
router.put('/update-profile', updateProfile);
router.put('/update-password', updatePassword);
router.put('/settings', updateSettings);
router.post('/upload-photo', upload.single('profile_picture'), uploadProfilePhoto);
router.post('/setup-2fa', setupTwoFactorAuth);
router.post('/verify-2fa', verifyTwoFactorToken);

export default router; 