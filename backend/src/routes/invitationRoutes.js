import express from 'express';
import {
  getInvitations,
  getInvitationHistory,
  acceptInvitation,
  rejectInvitation,
  sendInvitation,
  getPendingCount,
  cancelInvitation,
  searchUsersToInvite,
  getInvitationById,
  getPendingInvitations
} from '../controllers/invitationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// GET routes
router.get('/', getInvitations); // Get all invitations for user
router.get('/history', getInvitationHistory); // Get invitation history
router.get('/pending-count', getPendingCount);
router.get('/search-users', searchUsersToInvite);
router.get('/:id', getInvitationById);
router.get('/pending', getPendingInvitations);

// POST routes
router.post('/', sendInvitation);

// PUT routes
router.put('/:id/accept', acceptInvitation);
router.put('/:id/reject', rejectInvitation);

// DELETE routes
router.delete('/:id', cancelInvitation);

export default router;