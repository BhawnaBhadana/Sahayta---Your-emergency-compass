import * as routeService from '../services/routeService.js';
import { asyncHandler } from '../utils/apiError.js';

export const computeRouteHandler = asyncHandler(async (req, res) => {
  const route = await routeService.computeSafeRoute(req.query);
  res.json({ success: true, route });
});

export const listBlockedRoadsHandler = asyncHandler(async (req, res) => {
  const roads = await routeService.listBlockedRoads();
  res.json({ success: true, count: roads.length, blocked_roads: roads });
});

export const reportBlockedRoadHandler = asyncHandler(async (req, res) => {
  const road = await routeService.reportBlockedRoad(req.body, req.user?.id || null);
  res.status(201).json({ success: true, blocked_road: road });
});
