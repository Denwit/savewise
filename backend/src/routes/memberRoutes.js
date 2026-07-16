import express from 'express';
import {
  searchUsers,
  inviteUser,
  respondToInvitation,
  removeMember,
  updateMemberRole
} from '../controllers/memberController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.post('/:planId/invite', inviteUser);
router.put('/:planId/invite/respond', respondToInvitation);
router.delete('/:planId/members/:userId', removeMember);
router.put('/:planId/members/:userId/role', updateMemberRole);

export default router;