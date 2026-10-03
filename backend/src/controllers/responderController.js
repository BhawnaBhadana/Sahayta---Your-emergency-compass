import * as responderService from '../services/responderService.js';
import { asyncHandler } from '../utils/apiError.js';

export const listRespondersHandler = asyncHandler(async (req, res) => {
  const responders = await responderService.listResponders();
  res.json({ success: true, count: responders.length, responders });
});

export const listVolunteersHandler = asyncHandler(async (req, res) => {
  const volunteers = await responderService.listVolunteers();
  res.json({ success: true, count: volunteers.length, volunteers });
});

export const recommendHandler = asyncHandler(async (req, res) => {
  const { lat, lng, emergency_type } = req.query;
  const responders = await responderService.recommendResponders({
    latitude: Number(lat),
    longitude: Number(lng),
    emergencyType: emergency_type,
  });
  res.json({ success: true, responders });
});

export const updateMyResponderProfileHandler = asyncHandler(async (req, res) => {
  const profile = await responderService.updateOwnResponderProfile(req.user.id, req.body);
  res.json({ success: true, profile });
});

export const updateMyVolunteerProfileHandler = asyncHandler(async (req, res) => {
  const profile = await responderService.updateOwnVolunteerProfile(req.user.id, req.body);
  res.json({ success: true, profile });
});
