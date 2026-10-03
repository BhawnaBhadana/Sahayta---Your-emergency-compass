import * as userService from '../services/userService.js';
import { asyncHandler } from '../utils/apiError.js';

export const listUsersHandler = asyncHandler(async (req, res) => {
  const users = await userService.listUsers({ role: req.query.role });
  res.json({ success: true, count: users.length, users });
});

export const updateRoleHandler = asyncHandler(async (req, res) => {
  const user = await userService.updateUserRole(req.params.id, req.body.role, req.user.id);
  res.json({ success: true, user });
});

export const setActiveHandler = asyncHandler(async (req, res) => {
  const user = await userService.setUserActive(req.params.id, req.body.is_active, req.user.id);
  res.json({ success: true, user });
});

export const verifyOrgHandler = asyncHandler(async (req, res) => {
  const user = await userService.verifyOrganization(req.params.id, req.user.id);
  res.json({ success: true, user });
});
