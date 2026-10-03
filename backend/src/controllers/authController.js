import * as authService from '../services/authService.js';
import { asyncHandler } from '../utils/apiError.js';

export const registerHandler = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, ...result });
});

export const loginHandler = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ success: true, ...result });
});

export const meHandler = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json({ success: true, user });
});
