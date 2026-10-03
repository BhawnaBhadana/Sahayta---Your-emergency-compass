import * as familyService from '../services/familyService.js';
import { asyncHandler } from '../utils/apiError.js';

export const getMyFamilyHandler = asyncHandler(async (req, res) => {
  const family = await familyService.getMyFamily(req.user.id);
  res.json({ success: true, ...family });
});

export const addMemberHandler = asyncHandler(async (req, res) => {
  const member = await familyService.addMember(req.user.id, req.body);
  res.status(201).json({ success: true, member });
});

export const updateMemberStatusHandler = asyncHandler(async (req, res) => {
  const member = await familyService.updateMemberStatus(req.user.id, req.params.memberId, req.body.status);
  res.json({ success: true, member });
});

export const removeMemberHandler = asyncHandler(async (req, res) => {
  await familyService.removeMember(req.user.id, req.params.memberId);
  res.json({ success: true });
});
