import * as incidentService from '../services/incidentService.js';
import { asyncHandler } from '../utils/apiError.js';

export const createIncidentHandler = asyncHandler(async (req, res) => {
  const incident = await incidentService.createIncident(req.user?.id || null, req.body);
  res.status(201).json({ success: true, incident });
});

export const listIncidentsHandler = asyncHandler(async (req, res) => {
  const rows = await incidentService.listIncidents({ status: req.query.status });
  res.json({ success: true, count: rows.length, incidents: rows });
});

export const getIncidentHandler = asyncHandler(async (req, res) => {
  const result = await incidentService.getIncidentDetail(req.params.id);
  res.json({ success: true, ...result });
});

export const reviewIncidentHandler = asyncHandler(async (req, res) => {
  const incident = await incidentService.reviewIncident(req.params.id, req.body, req.user.id);
  res.json({ success: true, incident });
});
