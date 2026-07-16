import express from 'express';
import {
  getWithdrawals,
  createWithdrawal,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalAsPaid
} from '../controllers/withdrawalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getWithdrawals)
  .post(createWithdrawal);

router.put('/:id/approve', approveWithdrawal);
router.put('/:id/reject', rejectWithdrawal);
router.put('/:id/pay', markWithdrawalAsPaid);

export default router;