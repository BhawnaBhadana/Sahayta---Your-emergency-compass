import * as hospitalService from '../services/hospitalService.js';
import { asyncHandler } from '../utils/apiError.js';

export const createHospitalHandler = asyncHandler(async (req, res) => {
  const hospital = await hospitalService.createHospital(req.body, req.user.organizationId);
  res.status(201).json({ success: true, hospital });
});

export const listHospitalsHandler = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  const hospitals = await hospitalService.listHospitals({ lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null });
  res.json({ success: true, count: hospitals.length, hospitals });
});

export const getHospitalHandler = asyncHandler(async (req, res) => {
  const hospital = await hospitalService.getHospital(req.params.id);
  res.json({ success: true, hospital });
});

export const updateCapacityHandler = asyncHandler(async (req, res) => {
  const hospital = await hospitalService.updateCapacity(req.params.id, req.body);
  res.json({ success: true, hospital });
});
