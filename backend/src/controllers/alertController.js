import * as alertService from '../services/alertService.js';
import { asyncHandler } from '../utils/apiError.js';

export const createAlertHandler = asyncHandler(async (req, res) => {
  const alert = await alertService.createAlert(req.body, req.user.id);
  res.status(201).json({ success: true, alert });
});

export const listAlertsHandler = asyncHandler(async (req, res) => {
  const alerts = await alertService.listActiveAlerts();
  res.json({ success: true, count: alerts.length, alerts });
});

export const expireAlertHandler = asyncHandler(async (req, res) => {
  const alert = await alertService.expireAlert(req.params.id, req.user.id);
  res.json({ success: true, alert });
});

export const acknowledgeAlertHandler = asyncHandler(async (req, res) => {
  const alert = await alertService.acknowledgeAlert(req.params.id, req.user.id);
  res.json({ success: true, alert });
});

export const escalateAlertHandler = asyncHandler(async (req, res) => {
  const alert = await alertService.escalateAlert(req.params.id, req.user.id);
  res.json({ success: true, alert });
});

export const resolveAlertHandler = asyncHandler(async (req, res) => {
  const alert = await alertService.resolveAlert(req.params.id, req.user.id);
  res.json({ success: true, alert });
});
