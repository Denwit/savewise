// routes/planRoutes.js
import express from 'express';
import {
  createPlan,
  getPlans,
  getPlan,
  updatePlan,
  deletePlan,
  getDashboardStats,
  updatePlanSettings,
  getUserPlanDetails
} from '../controllers/planController.js';
import {
  removeMember,
  updateMemberRole
} from '../controllers/memberController.js';
import {
  generateInvitationLink,
  getPendingExternalInvitations
} from '../controllers/invitationLinkController.js';
import { getPlanMessages, sendPlanMessage } from '../controllers/planMessageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validatePlan } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', validatePlan, createPlan);
router.get('/', getPlans);
router.get('/dashboard/stats', getDashboardStats);

router.post('/:id/invite-external', generateInvitationLink);
router.get('/:id/pending-invitations', getPendingExternalInvitations);
router.get('/:id/user-details', getUserPlanDetails);
router.put('/:id/settings', updatePlanSettings);
router.get('/:id/messages', getPlanMessages);
router.post('/:id/messages', sendPlanMessage);

router.delete('/:planId/members/:userId', removeMember);
router.put('/:planId/members/:userId/role', updateMemberRole);

router.get('/:id', getPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

export default router;
