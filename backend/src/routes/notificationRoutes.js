import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  createNotification,
  getUnreadCount // Add this
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotifications)
  .post(createNotification);

router.get('/unread-count', getUnreadCount); // Add this route
router.put('/mark-all-read', markAllAsRead);
router.delete('/delete-read', deleteAllRead);
router.route('/:id')
  .put(markAsRead)
  .delete(deleteNotification);

export default router;