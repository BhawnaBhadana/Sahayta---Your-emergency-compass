import * as notificationService from '../services/notificationService.js';
import { asyncHandler } from '../utils/apiError.js';

export const listNotificationsHandler = asyncHandler(async (req, res) => {
  const notifications = await notificationService.listNotifications(req.user.id, { unreadOnly: req.query.unread === 'true' });
  res.json({ success: true, count: notifications.length, notifications });
});

export const markReadHandler = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationRead(req.user.id, req.params.id);
  res.json({ success: true, notification });
});

export const markAllReadHandler = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  res.json({ success: true });
});
