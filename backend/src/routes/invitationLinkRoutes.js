// routes/invitationLinkRoutes.js
import express from 'express';
import {
  getInvitationByToken,
  acceptInvitationByToken,
  cancelExternalInvitation
} from '../controllers/invitationLinkController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/:token', getInvitationByToken);

// Protected routes
router.post('/:token/accept', protect, acceptInvitationByToken);
router.delete('/external/:id', protect, cancelExternalInvitation);

export default router;