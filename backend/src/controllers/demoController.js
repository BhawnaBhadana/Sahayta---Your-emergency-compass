import * as demoService from '../services/demoService.js';
import { asyncHandler } from '../utils/apiError.js';

export const launchScenarioHandler = asyncHandler(async (req, res) => {
  const result = await demoService.launchScenario(req.user.id);
  res.status(202).json({ success: true, ...result });
});
