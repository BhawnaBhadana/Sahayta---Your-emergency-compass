import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', optionalAuth, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  res.status(201).json({ success: true, url: `/uploads/${req.file.filename}`, mime_type: req.file.mimetype, size: req.file.size });
}));

export default router;
