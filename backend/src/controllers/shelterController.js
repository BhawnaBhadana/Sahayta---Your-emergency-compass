import * as shelterService from '../services/shelterService.js';
import { asyncHandler } from '../utils/apiError.js';

export const createShelterHandler = asyncHandler(async (req, res) => {
  const shelter = await shelterService.createShelter(req.body, req.user.organizationId);
  res.status(201).json({ success: true, shelter });
});

export const listSheltersHandler = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  const shelters = await shelterService.listShelters({ lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null });
  res.json({ success: true, count: shelters.length, shelters });
});

export const recommendSheltersHandler = asyncHandler(async (req, res) => {
  const { lat, lng, needs_medical } = req.query;
  const shelters = await shelterService.recommendShelters({ lat: Number(lat), lng: Number(lng), needsMedical: needs_medical === 'true' });
  res.json({ success: true, shelters });
});

export const getShelterHandler = asyncHandler(async (req, res) => {
  const shelter = await shelterService.getShelter(req.params.id);
  res.json({ success: true, shelter });
});

export const updateOccupancyHandler = asyncHandler(async (req, res) => {
  const shelter = await shelterService.updateOccupancy(req.params.id, req.body.occupied, req.user.id);
  res.json({ success: true, shelter });
});
