import * as analyticsService from '../services/analyticsService.js';
import { listAuditLogs } from '../services/auditService.js';
import { asyncHandler } from '../utils/apiError.js';

export const commandCenterHandler = asyncHandler(async (req, res) => {
  const metrics = await analyticsService.getCommandCenterMetrics();
  res.json({ success: true, metrics });
});

export const responseTimesHandler = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getResponseTimeAnalytics();
  res.json({ success: true, analytics });
});

export const incidentBreakdownHandler = asyncHandler(async (req, res) => {
  const breakdown = await analyticsService.getIncidentBreakdown();
  res.json({ success: true, breakdown });
});

export const auditLogsHandler = asyncHandler(async (req, res) => {
  const logs = await listAuditLogs({ limit: Number(req.query.limit) || 100 });
  res.json({ success: true, count: logs.length, logs });
});

export const incidentsOverTimeHandler = asyncHandler(async (req, res) => {
  const series = await analyticsService.getIncidentsOverTime(Number(req.query.days) || 14);
  res.json({ success: true, series });
});

export const ratesHandler = asyncHandler(async (req, res) => {
  const rates = await analyticsService.getVerificationAndResolutionRates();
  res.json({ success: true, rates });
});

export const teamUtilizationHandler = asyncHandler(async (req, res) => {
  const utilization = await analyticsService.getTeamUtilization();
  res.json({ success: true, utilization });
});

export const hotspotsHandler = asyncHandler(async (req, res) => {
  const hotspots = await analyticsService.getIncidentHotspots({
    hours: Number(req.query.hours) || 24,
    threshold: Number(req.query.threshold) || 2,
  });
  res.json({ success: true, count: hotspots.length, hotspots });
});
