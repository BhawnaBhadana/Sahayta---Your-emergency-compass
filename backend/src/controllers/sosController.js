import * as sosService from '../services/sosService.js';
import { asyncHandler } from '../utils/apiError.js';

export const createSosHandler = asyncHandler(async (req, res) => {
  const result = await sosService.createSos(req.user?.id || null, req.body);
  res.status(201).json({ success: true, ...result });
});

export const listSosHandler = asyncHandler(async (req, res) => {
  const rows = await sosService.listSos({ role: req.user.role, userId: req.user.id, status: req.query.status });
  res.json({ success: true, count: rows.length, sos_requests: rows });
});

export const getSosHandler = asyncHandler(async (req, res) => {
  const result = await sosService.getSosDetail(req.params.id, req.user);
  res.json({ success: true, ...result });
});

export const assignResponderHandler = asyncHandler(async (req, res) => {
  const sos = await sosService.assignResponder(req.params.id, req.body.responder_id, req.user.id);
  res.json({ success: true, sos });
});

export const updateStatusHandler = asyncHandler(async (req, res) => {
  const sos = await sosService.updateStatus(req.params.id, req.body.status, req.body.note, req.user.id);
  res.json({ success: true, sos });
});

export const confirmTriageHandler = asyncHandler(async (req, res) => {
  const sos = await sosService.confirmTriage(req.params.id, req.user.id, req.body.priority);
  res.json({ success: true, sos });
});
