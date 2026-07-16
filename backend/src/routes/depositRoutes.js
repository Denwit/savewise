import express from 'express';
import {
  createDeposit,
  getPlanDeposits,
  getMyDeposits,
  updateDeposit,
  getAllDeposits,
  getDepositById,
  deleteDeposit,
  getDepositStats,
  approveDeposit,
  rejectDeposit
} from '../controllers/depositController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createDeposit);
router.get('/plan/:planId', getPlanDeposits);
router.get('/my-deposits', getMyDeposits);
router.get('/all', getAllDeposits);
router.get('/stats/overview', getDepositStats);
router.get('/:id', getDepositById);
router.put('/:id', updateDeposit);
router.delete('/:id', deleteDeposit);
router.put('/:id/approve', approveDeposit);
router.put('/:id/reject', rejectDeposit);
router.post('/:id/delete', deleteDeposit);

export default router;