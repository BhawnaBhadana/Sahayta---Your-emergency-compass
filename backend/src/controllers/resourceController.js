import * as resourceService from '../services/resourceService.js';
import { asyncHandler } from '../utils/apiError.js';
import { ApiError } from '../utils/apiError.js';

export const createResourceHandler = asyncHandler(async (req, res) => {
  const resource = await resourceService.createResource(req.body, req.user.organizationId);
  res.status(201).json({ success: true, resource });
});

export const listResourcesHandler = asyncHandler(async (req, res) => {
  const resources = await resourceService.listResources({ category: req.query.category });
  res.json({ success: true, count: resources.length, resources });
});

export const updateResourceHandler = asyncHandler(async (req, res) => {
  const resource = await resourceService.updateResource(req.params.id, req.body);
  res.json({ success: true, resource });
});

export const findMatchesHandler = asyncHandler(async (req, res) => {
  const { category, quantity, lat, lng } = req.query;
  if (!category || !quantity) throw new ApiError(400, 'category and quantity query params are required');
  const result = await resourceService.findMatches(category, Number(quantity), lat ? Number(lat) : null, lng ? Number(lng) : null);
  res.json({ success: true, ...result });
});

export const createResourceRequestHandler = asyncHandler(async (req, res) => {
  const request = await resourceService.createResourceRequest(req.body, req.user.id);
  res.status(201).json({ success: true, request });
});

export const listResourceRequestsHandler = asyncHandler(async (req, res) => {
  const requests = await resourceService.listResourceRequests();
  res.json({ success: true, count: requests.length, requests });
});

export const updateResourceRequestHandler = asyncHandler(async (req, res) => {
  const request = await resourceService.updateResourceRequestStatus(req.params.id, req.body.status, req.user.id);
  res.json({ success: true, request });
});
