import * as missingPersonService from '../services/missingPersonService.js';
import { asyncHandler } from '../utils/apiError.js';

export const createHandler = asyncHandler(async (req, res) => {
  const record = await missingPersonService.reportMissingPerson(req.body, req.user?.id || null);
  res.status(201).json({ success: true, missing_person: record });
});

export const listHandler = asyncHandler(async (req, res) => {
  const records = await missingPersonService.listMissingPersons({ status: req.query.status });
  res.json({ success: true, count: records.length, missing_persons: records });
});

export const updateStatusHandler = asyncHandler(async (req, res) => {
  const record = await missingPersonService.updateMissingPersonStatus(req.params.id, req.body.status, req.user.id);
  res.json({ success: true, missing_person: record });
});
